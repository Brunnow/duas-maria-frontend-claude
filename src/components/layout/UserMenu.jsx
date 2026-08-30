import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { FiUser } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, selectAuth } from '@/features/auth/authSlice';
import { cn } from '@/lib/cn';

const itemClass = (focus, tone = 'text-foreground') =>
  cn('block w-full px-4 py-2 text-left text-sm', tone, focus && 'bg-subtle');

/** Menu da conta (usuario autenticado). */
export default function UserMenu({ username }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { roles } = useSelector(selectAuth);
  const isAdmin = roles.includes('ROLE_ADMIN');

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton
        aria-label="Minha conta"
        className="flex items-center gap-2 rounded-control p-2 text-foreground transition-colors hover:bg-subtle"
      >
        <FiUser size={20} />
        <span className="hidden max-w-24 truncate text-sm sm:inline">{username}</span>
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-50 mt-2 w-44 rounded-card border border-border bg-surface py-1 shadow-pop focus:outline-none"
      >
        <MenuItem>
          {({ focus }) => (
            <button type="button" onClick={() => navigate('/conta')} className={itemClass(focus)}>
              Minha conta
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button type="button" onClick={() => navigate('/pedidos')} className={itemClass(focus)}>
              Meus pedidos
            </button>
          )}
        </MenuItem>
        {isAdmin && (
          <MenuItem>
            {({ focus }) => (
              <button type="button" onClick={() => navigate('/admin')} className={itemClass(focus)}>
                Administração
              </button>
            )}
          </MenuItem>
        )}
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              onClick={handleLogout}
              className={itemClass(focus, 'text-danger')}
            >
              Sair
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
