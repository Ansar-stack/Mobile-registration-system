import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (!token) {
      toast.error(t('resetPassword.invalidToken'));
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword(data.password, token);
      toast.success(t('resetPassword.resetSuccess'));
      navigate('/login');
    } catch (error) {
      toast.error(error.message || t('resetPassword.failedReset'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t('resetPassword.newPassword')}</Label>
          <Input
            id="password"
            type="password"
            {...register('password', {
              required: t('resetPassword.passwordRequired'),
              minLength: { value: 8, message: t('resetPassword.passwordMin') },
            })}
            className={errors.password ? 'border-destructive' : ''}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword', {
              required: t('resetPassword.confirmRequired'),
              validate: (val) => watch('password') === val || t('resetPassword.passwordMismatch'),
            })}
            className={errors.confirmPassword ? 'border-destructive' : ''}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('resetPassword.resetBtn')}
        </Button>
      </form>

      <div className="text-center">
        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('resetPassword.backToLogin')}
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
