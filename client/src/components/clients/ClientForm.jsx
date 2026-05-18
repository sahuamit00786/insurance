import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function ClientForm({ defaultValues = {}, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Client Name *" error={errors.name?.message}
          {...register('name', { required: 'Required' })} placeholder="Full name"/>
        <Input label="IC / Passport No" {...register('identification_no')} placeholder="IC or passport number"/>
        <Input label="Date of Birth" type="date" {...register('date_of_birth')}/>
        <Input label="Phone Number" {...register('phone')} placeholder="+60 12-345 6789"/>
        <Input label="Email" type="email" {...register('email')} placeholder="email@example.com"/>
      </div>
      <div>
        <label className="label-base">Home Address</label>
        <textarea className="input-base resize-none" rows={3}
          {...register('address')} placeholder="Full address..."/>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>Save Client</Button>
      </div>
    </form>
  );
}
