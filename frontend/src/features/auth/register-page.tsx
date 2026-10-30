import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { FormBanner, FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applyServerErrors } from '@/lib/api/form-errors';

import { AuthLayout } from './auth-layout';
import { useRegister } from './hooks';

const registerSchema = z
  .object({
    first_name: z.string().trim().max(150).min(1, 'Enter your first name'),
    last_name: z.string().trim().max(150).min(1, 'Enter your last name'),
    email: z.email('Enter a valid email address').max(254),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });
type RegisterValues = z.infer<typeof registerSchema>;

const SERVER_FIELDS = ['first_name', 'last_name', 'email', 'password'] as const;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useRegister();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirm: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ confirm: _confirm, ...body }) => {
    try {
      await registerUser.mutateAsync(body);
      toast.success('Account created', { description: `Signed in as ${body.email}` });
      navigate('/', { replace: true });
    } catch (error) {
      applyServerErrors(error, form.setError, SERVER_FIELDS);
    }
  });

  const field = (name: keyof RegisterValues) => ({
    id: name,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    ...form.register(name),
  });

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Book flights and manage your trips."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="grid gap-4">
        <FormBanner message={errors.root?.server?.message} />
        <div className="grid grid-cols-2 gap-3">
          <FormField id="first_name" label="First name" error={errors.first_name?.message}>
            <Input autoComplete="given-name" autoFocus {...field('first_name')} />
          </FormField>
          <FormField id="last_name" label="Last name" error={errors.last_name?.message}>
            <Input autoComplete="family-name" {...field('last_name')} />
          </FormField>
        </div>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...field('email')} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...field('password')} />
        </FormField>
        <FormField id="confirm" label="Confirm password" error={errors.confirm?.message}>
          <Input type="password" autoComplete="new-password" {...field('confirm')} />
        </FormField>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
