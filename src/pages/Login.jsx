import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import { login, selectIsAuthenticated } from '@/features/auth/authSlice';
import { required, validateForm } from '@/lib/validation';

const schema = {
  username: [required('Informe seu usuário')],
  password: [required('Informe sua senha')],
};

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const from = location.state?.from?.pathname || '/';
  const justRegistered = location.state?.registered === true;
  const intentMessage = location.state?.message;

  const [values, setValues] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateForm(values, schema);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await dispatch(
        login({ username: values.username.trim(), password: values.password }),
      ).unwrap();
      navigate(from, { replace: true });
    } catch (message) {
      setFormError(typeof message === 'string' ? message : 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="flex flex-col items-center py-16 lg:py-24">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-foreground">Entrar</h1>
        <p className="mt-2 text-sm text-muted">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="text-accent hover:underline">
            Criar conta
          </Link>
        </p>

        {(justRegistered || intentMessage) && (
          <p
            role="status"
            className="mt-4 rounded-card bg-success/10 px-3 py-2 text-sm text-success"
          >
            {justRegistered ? 'Cadastro concluído. Faça login para continuar.' : intentMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <Input
            label="Usuário"
            name="username"
            value={values.username}
            onChange={handleChange}
            error={errors.username}
            autoComplete="username"
          />
          <Input
            label="Senha"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
          />

          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" loading={submitting} className="mt-2">
            Entrar
          </Button>
        </form>
      </div>
    </Container>
  );
}
