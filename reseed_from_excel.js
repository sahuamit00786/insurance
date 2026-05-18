/**
 * Re-seeds clients and insurances from PolicyStatusSearch.xlsx.
 * Groups rows by client name → one client record per unique person,
 * multiple insurance records per client.
 *
 * Run from project root:  node reseed_from_excel.js
 */
const XLSX  = require('xlsx');
const mysql = require('mysql2/promise');
const path  = require('path');

function excelDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const d = XLSX.SSF.parse_date_code(serial);
  return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
}

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306,
    database: 'insurance', user: 'root', password: 'Admin@123',
  });
  console.log('✓ Connected');

  const wb   = XLSX.readFile(path.join(__dirname, 'PolicyStatusSearch.xlsx'));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Table 1'], { header: 1 }).slice(1);
  console.log(`✓ ${rows.length} Excel rows`);

  // Lookup helper
  const cache = {};
  async function lookupId(slug, value) {
    if (!value) return null;
    const key = `${slug}::${value}`;
    if (cache[key] !== undefined) return cache[key];
    const [[cat]] = await conn.execute('SELECT id FROM lookup_categories WHERE slug = ?', [slug]);
    if (!cat) throw new Error(`Missing category: ${slug}`);
    const [[ex]] = await conn.execute(
      'SELECT id FROM lookup_values WHERE category_id = ? AND value = ?', [cat.id, value]
    );
    if (ex) { cache[key] = ex.id; return ex.id; }
    const [r] = await conn.execute(
      'INSERT INTO lookup_values (category_id, value, sort_order) VALUES (?,?,0)', [cat.id, value]
    );
    cache[key] = r.insertId;
    return r.insertId;
  }

  // Pre-warm lookups
  for (const { col, slug } of [
    { col: 9,  slug: 'plan_code'      },
    { col: 10, slug: 'payment_mode'   },
    { col: 11, slug: 'payment_method' },
    { col: 13, slug: 'client_status'  },
  ]) {
    const uniq = [...new Set(rows.map(r => r[col]).filter(Boolean))];
    for (const v of uniq) await lookupId(slug, v);
    console.log(`  ${slug}: ${uniq.length} values`);
  }

  const [[admin]] = await conn.execute("SELECT id FROM users WHERE role='admin' LIMIT 1");
  const adminId = admin?.id ?? null;

  // Clear existing data
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
  await conn.execute('TRUNCATE TABLE insurances');
  await conn.execute('TRUNCATE TABLE clients');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✓ Cleared existing clients & insurances');

  // Group rows by name → clientId cache
  const clientCache = {}; // name → id
  let clientCount = 0, insCount = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r       = rows[i];
    const name    = String(r[1] || '').trim();
    const policyNo = String(r[14] || '').trim();
    if (!name || !policyNo) continue;

    const icNo    = r[2] ? String(r[2]).trim() : null;
    const planId  = await lookupId('plan_code',      r[9]  || null);
    const modeId  = await lookupId('payment_mode',   r[10] || null);
    const methId  = await lookupId('payment_method', r[11] || null);
    const statId  = await lookupId('client_status',  r[13] || null);

    try {
      // Get or create client by name
      let clientId = clientCache[name];
      if (!clientId) {
        const [res] = await conn.execute(
          `INSERT INTO clients (name, identification_no, date_of_birth, address, phone, email, created_by)
           VALUES (?,?,?,?,?,?,?)`,
          [
            name,
            icNo,
            r[3] ? excelDate(r[3]) : null,
            r[4] || null,
            r[5] ? String(r[5]) : null,
            r[6] || null,
            adminId,
          ]
        );
        clientId = res.insertId;
        clientCache[name] = clientId;
        clientCount++;
      }

      // Insert insurance record
      await conn.execute(
        `INSERT INTO insurances
           (client_id, identification_no, policy_no, plan_code_id,
            issued_date, maturity_date, premium, status_id,
            payment_mode_id, payment_method_id, premium_due_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          clientId, icNo, policyNo, planId,
          excelDate(r[7]), excelDate(r[8]),
          r[15] != null ? parseFloat(r[15]) : null,
          statId, modeId, methId,
          excelDate(r[12]),
        ]
      );
      insCount++;
    } catch (err) {
      errors++;
      console.error(`  Row ${i + 2}: ${err.message}`);
    }

    if ((i + 1) % 200 === 0) console.log(`  ${i + 1}/${rows.length}…`);
  }

  await conn.end();
  console.log('\n── Done ────────────────────────');
  console.log(`  Clients inserted : ${clientCount}`);
  console.log(`  Insurances       : ${insCount}`);
  console.log(`  Errors           : ${errors}`);
}

run().catch(err => { console.error(err); process.exit(1); });
