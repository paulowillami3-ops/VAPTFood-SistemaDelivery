import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
    isNewOrderModalOpen: boolean;
    editingOrder: any | null;
    openNewOrderModal: (order?: any) => void;
    closeNewOrderModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any | null>(null);

    const openNewOrderModal = (order?: any) => {
        setEditingOrder(order || null);
        setIsNewOrderModalOpen(true);
    };

    const closeNewOrderModal = () => {
        setIsNewOrderModalOpen(false);
        setEditingOrder(null);
    };

    return (
        <UIContext.Provider value={{ isNewOrderModalOpen, editingOrder, openNewOrderModal, closeNewOrderModal }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
