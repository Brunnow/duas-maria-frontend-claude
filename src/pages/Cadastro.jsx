import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import { register, selectIsAuthenticated } from '@/features/auth/authSlice';
import { isEmail, maxLength, minLength, required, validateForm } from '@/lib/validation';

// Espelha as regras do backend (SignupRequest).
const schema = {
  username: [
    required('Informe um usuário'),
    minLength(3, 'Mínimo de 3 caracteres'),
    maxLength(20, 'Máximo de 20 caracteres'),
  ],
  email: [required('Informe seu e-mail'), isEmail(), maxLength(50, 'Máximo de 50 caracteres')],
  password: [
    required('Informe uma senha'),
    minLength(6, 'Mínimo de 6 caracteres'),
    maxLength(40, 'Máximo de 40 caracteres'),
  ],
};

export default function Cadastro() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [values, setValues] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
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
    if (!values.confirm) found.confirm = 'Confirme a senha';
    else if (values.confirm !== values.password) found.confirm = 'As senhas não conferem';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await dispatch(
        register({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      ).unwrap();
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (message) {
      setFormError(typeof message === 'string' ? message : 'Não foi possível concluir o cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="flex flex-col items-center py-16 lg:py-24">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-foreground">Criar conta</h1>
        <p className="mt-2 text-sm text-muted">
          Já tem conta?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Entrar
          </Link>
        </p>

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
            label="E-mail"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Senha"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="Confirmar senha"
            name="confirm"
            type="password"
            value={values.confirm}
            onChange={handleChange}
            error={errors.confirm}
            autoComplete="new-password"
          />

          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" loading={submitting} className="mt-2">
            Criar conta
          </Button>
        </form>
      </div>
    </Container>
  );
}
