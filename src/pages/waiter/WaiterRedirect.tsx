import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const WaiterRedirect = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Verifica se há um garçom logado para este estabelecimento
        const session = localStorage.getItem(`waiter_session_${slug}`);

        if (session) {
            navigate(`/${slug}/garcom/app`, { replace: true });
        } else {
            navigate(`/${slug}/garcom/login`, { replace: true });
        }
    }, [slug, navigate]);

    return (
        <div className="min-h-screen bg-[#003152] flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
    );
};

export default WaiterRedirect;
