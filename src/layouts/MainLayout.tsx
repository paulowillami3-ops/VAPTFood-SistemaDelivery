import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useState, type ReactNode } from 'react';

import NewOrderModal from '../components/NewOrderModal';
import MobileBottomNav from '../components/MobileBottomNav';
import { useUI } from '../contexts/UIContext';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { isNewOrderModalOpen, closeNewOrderModal, editingOrder } = useUI();

    return (
        <div className="flex bg-gray-100 min-h-screen font-sans pb-20 md:pb-0">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} ml-0`}>
                <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className="flex-1 overflow-x-hidden p-6 md:p-8">
                    {children}
                </div>
            </main>

            {/* Global Modals & Components */}
            <NewOrderModal isOpen={isNewOrderModalOpen} onClose={closeNewOrderModal} order={editingOrder} />
            <MobileBottomNav />
        </div>
    );
};

export default MainLayout;
