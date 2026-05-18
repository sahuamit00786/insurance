import { useQuery } from '@tanstack/react-query';
import { getValues } from '../api/lookup';

export default function useLookup(slug) {
  const { data } = useQuery({
    queryKey: ['lookup', slug],
    queryFn:  () => getValues(slug).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
    enabled:  !!slug,
  });
  return (data || []).filter(v => v.is_active).map(v => ({
    value: v.id,
    label: v.lookup_name ?? v.value,
  }));
}
