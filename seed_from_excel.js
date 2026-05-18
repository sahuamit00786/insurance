/**
 * Seeds clients and insurance records from PolicyStatusSearch.xlsx
 * Run from: c:\Users\sahua\Downloads\Insurance\
 *   node seed_from_excel.js
 */
const XLSX  = require('xlsx');
const mysql = require('mysql2/promise');
const path  = require('path');

// ── Excel date serial → 'YYYY-MM-DD' ──────────────────────────────────────
function excelDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const d = XLSX.SSF.parse_date_code(serial);
  return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
}

async function run() {
  const conn = await mysql.createConnection({
    host:     'localhost',
    port:     3306,
    database: 'insurance',
    user:     'root',
    password: 'Admin@123',
  });
  console.log('✓ Connected to MySQL');

  // ── Read Excel ──────────────────────────────────────────────────────────
  const wb   = XLSX.readFile(path.join(__dirname, 'PolicyStatusSearch.xlsx'));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Table 1'], { header: 1 }).slice(1);
  console.log(`✓ Loaded ${rows.length} rows from Excel`);

  // ── Lookup helper: get or create a value, return its id ─────────────────
  const cache = {};
  async function lookupId(slug, value) {
    if (!value) return null;
    const key = `${slug}::${value}`;
    if (cache[key] !== undefined) return cache[key];

    const [[cat]] = await conn.execute(
      'SELECT id FROM lookup_categories WHERE slug = ?', [slug]
    );
    if (!cat) throw new Error(`Lookup category not found: ${slug}`);

    const [[existing]] = await conn.execute(
      'SELECT id FROM lookup_values WHERE category_id = ? AND value = ?',
      [cat.id, value]
    );
    if (existing) { cache[key] = existing.id; return existing.id; }

    const [res] = await conn.execute(
      'INSERT INTO lookup_values (category_id, value, sort_order) VALUES (?, ?, 0)',
      [cat.id, value]
    );
    cache[key] = res.insertId;
    return res.insertId;
  }

  // ── Pre-warm all unique lookup values ───────────────────────────────────
  console.log('Pre-loading lookup values...');
  const fields = [
    { col: 9,  slug: 'plan_code'      },
    { col: 10, slug: 'payment_mode'   },
    { col: 11, slug: 'payment_method' },
    { col: 13, slug: 'client_status'  },
  ];
  for (const { col, slug } of fields) {
    const uniq = [...new Set(rows.map(r => r[col]).filter(Boolean))];
    for (const v of uniq) await lookupId(slug, v);
    console.log(`  ${slug}: ${uniq.length} values`);
  }

  // ── Get admin user id for created_by ────────────────────────────────────
  const [[admin]] = await conn.execute(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  );
  const adminId = admin?.id ?? null;

  // ── Insert rows ─────────────────────────────────────────────────────────
  let inserted = 0, skipped = 0, errors = 0;
  console.log('\nInserting clients & insurance records...');

  for (let i = 0; i < rows.length; i++) {
    const r         = rows[i];
    const name      = String(r[1] || '').trim();
    const policyNo  = String(r[14] || '').trim();

    if (!name || !policyNo) { skipped++; continue; }

    // Use policy_no as identification_no since IC numbers are absent in the data
    const identNo   = policyNo;

    const issuedDate  = excelDate(r[7]);
    const maturity    = excelDate(r[8]);
    const premDue     = excelDate(r[12]);
    const totalPrem   = r[15] != null ? parseFloat(r[15]) : null;

    const planId   = await lookupId('plan_code',      r[9]  || null);
    const modeId   = await lookupId('payment_mode',   r[10] || null);
    const methodId = await lookupId('payment_method', r[11] || null);
    const statusId = await lookupId('client_status',  r[13] || null);

    try {
      const [clientRes] = await conn.execute(
        `INSERT IGNORE INTO clients
           (name, identification_no, date_of_birth, address, phone, email,
            issued_date, maturity_date, plan_code_id, payment_mode_id,
            payment_method_id, premium_due_date, status_id,
            policy_no, total_premium, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          name, identNo,
          r[3] ? excelDate(r[3]) : null,
          r[4] || null,
          r[5] ? String(r[5]) : null,
          r[6] || null,
          issuedDate, maturity,
          planId, modeId, methodId,
          premDue, statusId,
          policyNo, totalPrem, adminId,
        ]
      );

      if (clientRes.affectedRows > 0) {
        const clientId = clientRes.insertId;
        await conn.execute(
          `INSERT IGNORE INTO insurances
             (client_id, policy_no, plan_code_id,
              issued_date, maturity_date, premium, status_id)
           VALUES (?,?,?,?,?,?,?)`,
          [clientId, policyNo, planId, issuedDate, maturity, totalPrem, statusId]
        );
        inserted++;
      } else {
        skipped++; // duplicate policy_no / identification_no
      }

      if ((i + 1) % 200 === 0) {
        console.log(`  ${i + 1} / ${rows.length} processed…`);
      }
    } catch (err) {
      errors++;
      console.error(`  Row ${i + 2} error: ${err.message}`);
    }
  }

  await conn.end();
  console.log('\n── Done ────────────────────────────────');
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Skipped  : ${skipped}  (duplicates or empty)`);
  console.log(`  Errors   : ${errors}`);
}

run().catch(err => { console.error(err); process.exit(1); });
