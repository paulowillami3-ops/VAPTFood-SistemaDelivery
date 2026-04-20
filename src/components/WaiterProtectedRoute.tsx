import { Navigate, useParams, Outlet } from 'react-router-dom';

const WaiterProtectedRoute = () => {
    const { slug } = useParams();

    // Verifica a sessão do garçom para este estabelecimento específico
    const session = localStorage.getItem(`waiter_session_${slug}`);

    if (!session) {
        // Redireciona para o login do garçom se não houver sessão para este estabelecimento
        return <Navigate to={`/${slug}/garcom/login`} replace />;
    }

    try {
        const data = JSON.parse(session);
        // Opcional: Validar se o establishment_id na sessão bate com o contexto se possível
        if (!data || !data.id) {
            return <Navigate to={`/${slug}/garcom/login`} replace />;
        }
    } catch (e) {
        return <Navigate to={`/${slug}/garcom/login`} replace />;
    }

    // Se estiver tudo OK, renderiza as rotas filhas
    return <Outlet />;
};

export default WaiterProtectedRoute;
