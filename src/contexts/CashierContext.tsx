import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEstablishment } from '../contexts/EstablishmentContext';

interface CashierSession {
    id: string;
    opened_at: string;
    closed_at?: string;
    initial_balance: number;
    status: 'OPEN' | 'CLOSED';
}

interface CashierSummary {
    cash_balance: number;
    card_balance: number;
    total_sales: number;
    transactions: any[];
}

interface CashierContextType {
    isCashierOpen: boolean;
    currentSession: CashierSession | null;
    openCashier: (initialBalance: number) => Promise<void>;
    closeCashier: (finalValues: { money: number; card: number }) => Promise<void>;
    addTransaction: (type: 'WITHDRAWAL' | 'SUPPLY', amount: number, description: string) => Promise<void>;
    registerSale: (amount: number, paymentMethod: string, description: string) => Promise<void>;
    getSummary: () => Promise<CashierSummary>;
    checkStatus: () => Promise<void>;
}

const CashierContext = createContext<CashierContextType>({
    isCashierOpen: false,
    currentSession: null,
    openCashier: async () => { },
    closeCashier: async () => { },
    addTransaction: async () => { },
    registerSale: async () => { },
    getSummary: async () => ({ cash_balance: 0, card_balance: 0, total_sales: 0, transactions: [] }),
    checkStatus: async () => { },
});

export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { establishment } = useEstablishment();
    const [isCashierOpen, setIsCashierOpen] = useState(false);
    const [currentSession, setCurrentSession] = useState<CashierSession | null>(null);

    const checkStatus = async () => {
        if (!establishment?.id) return;
        try {
            // Find the most recent session for this establishment
            const { data } = await supabase
                .from('cashier_sessions')
                .select('*')
                .eq('establishment_id', establishment.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .limit(1)
                .maybeSingle();

            if (data && data.status === 'OPEN') {
                setIsCashierOpen(true);
                setCurrentSession(data);
            } else {
                setIsCashierOpen(false);
                setCurrentSession(null);
            }
        } catch (err) {
            console.error('Failed to check cashier status:', err);
        }
    };

    const openCashier = async (initialBalance: number) => {
        if (!establishment?.id) throw new Error('No establishment selected');
        try {
            const { data, error } = await supabase
                .from('cashier_sessions')
                .insert({
                    establishment_id: establishment.id,
                    initial_balance: initialBalance,
                    status: 'OPEN',
                    opened_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            setIsCashierOpen(true);
            setCurrentSession(data);
        } catch (err) {
            console.error('Error opening cashier:', err);
            throw err;
        }
    };

    const closeCashier = async (finalValues: { money: number; card: number }) => {
        if (!currentSession) return;

        try {
            const { error } = await supabase
                .from('cashier_sessions')
                .update({
                    status: 'CLOSED',
                    closed_at: new Date().toISOString(),
                    final_money_balance: finalValues.money,
                    final_card_balance: finalValues.card,
                    final_balance: finalValues.money + finalValues.card
                })
                .eq('id', currentSession.id);

            if (error) throw error;
            setIsCashierOpen(false);
            setCurrentSession(null);
        } catch (err) {
            console.error('Error closing cashier:', err);
            throw err;
        }
    };

    const addTransaction = async (type: 'WITHDRAWAL' | 'SUPPLY', amount: number, description: string) => {
        if (!currentSession) return;

        try {
            const { error } = await supabase
                .from('cashier_transactions')
                .insert({
                    session_id: currentSession.id,
                    type,
                    amount,
                    description,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (err) {
            console.error(`Error adding ${type}:`, err);
            throw err;
        }
    };

    const registerSale = async (amount: number, paymentMethod: string, description: string) => {
        console.log('Attempting to register sale:', { amount, paymentMethod, description, currentSession });

        if (!currentSession) {
            console.warn('No open cashier session found. Sale will not be registered.');
            return;
        }

        try {
            // Handle numeric conversion just in case
            const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

            if (isNaN(numericAmount)) {
                console.error('Invalid amount for sale:', amount);
                return;
            }

            const { error } = await supabase
                .from('cashier_transactions')
                .insert({
                    session_id: currentSession.id,
                    type: 'SALE',
                    amount: numericAmount,
                    payment_method: paymentMethod,
                    description,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Sale registered successfully.');

        } catch (err) {
            console.error('Error registering sale:', err);
            // Don't throw to avoid blocking the main flow, just log
        }
    };

    const getSummary = async (): Promise<CashierSummary> => {
        if (!currentSession || !establishment?.id) {
            return {
                cash_balance: 0,
                card_balance: 0,
                total_sales: 0,
                transactions: []
            };
        }

        try {
            // 1. Fetch Manual Transactions (Supplies/Withdrawals)
            const { data: transData, error: transError } = await supabase
                .from('cashier_transactions')
                .select('*')
                .eq('session_id', currentSession.id);

            if (transError) throw transError;
            const transactions = transData || [];

            // 2. Fetch Finalized Orders for this Session
            // We consider orders created AFTER the session opened.
            // A more robust way would be orders PAID or DELIVERED in this window, but created_at is standard for POS.
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('establishment_id', establishment.id)
                .gte('created_at', currentSession.opened_at)
                .eq('status', 'DELIVERED');

            if (ordersError) throw ordersError;
            const orders = ordersData || [];

            // 3. Calculate Totals
            let totalSales = 0;
            let salesCash = 0;
            let salesCard = 0;
            // You might want to track others like 'pix' separately if needed, for now grouping into 'card/other' or specific
            // Let's stick to the interface: cash vs card (or non-cash)

            orders.forEach((order: any) => {
                totalSales += (order.total_amount || 0);

                if (order.payment_method === 'split' && order.payment_methods) {
                    // Handle Split
                    const methods = typeof order.payment_methods === 'string'
                        ? JSON.parse(order.payment_methods)
                        : order.payment_methods;

                    if (Array.isArray(methods)) {
                        methods.forEach((m: any) => {
                            if (m.type === 'money') {
                                salesCash += Number(m.amount);
                            } else {
                                salesCard += Number(m.amount);
                            }
                        });
                    }
                } else if (order.payment_method === 'money') {
                    salesCash += (order.total_amount || 0);
                } else {
                    // Card, Pix, etc -> Count as "Card" for the simple summary or "Non-Cash"
                    salesCard += (order.total_amount || 0);
                }
            });

            const withdrawals = transactions.filter(t => t.type === 'WITHDRAWAL');
            const supplies = transactions.filter(t => t.type === 'SUPPLY');

            const totalWithdrawals = withdrawals.reduce((acc, t) => acc + Number(t.amount), 0);
            const totalSupplies = supplies.reduce((acc, t) => acc + Number(t.amount), 0);

            // Balance Calculation
            // Initial + Supplies - Withdrawals + Cash Sales
            const cashBalance = currentSession.initial_balance + totalSupplies - totalWithdrawals + salesCash;
            const cardBalance = salesCard;

            // We can return 'transactions' as the manual ones combined with a virtual 'sales' summary if needed
            // But the UI iterates 'transactions' to show breakdown. 
            // The existing UI filters transactions by type='SALE'. We should simulate that or update UI.
            // Best approach: Add a virtual transaction for "Total Sales" or rely on the calculated balances.
            // The UI in PartialSummaryModal calculates sales from `transactions` array:
            // `summary?.transactions?.filter((t: any) => t.type === 'SALE' ...`
            // So we need to populate `transactions` with the orders OR update the UI to use `total_sales`.

            // Hack for UI compatibility:
            // Create "virtual" transactions for each order so the UI breakdown works (if it lists them)
            // OR just return the totals and ensure UI uses `cash_balance` / `card_balance` provided here.

            // Looking at PartialSummaryModal:
            // It calculates sales: `formatCurrency((summary?.transactions?.filter((t: any) => t.type === 'SALE' && t.payment_method === 'money').reduce...`
            // This suggests it RE-CALCULATES based on the returned transaction list.

            // To support the existing UI without rewriting it completely, let's Push orders as "transactions" into the list.


            // Better Approach for Split compatibility:
            // Instead of mapping 1-to-1, let's map 1-to-Many parts of the split.
            const expandedOrderTransactions: any[] = [];

            orders.forEach((o: any) => {
                if (o.payment_method === 'split' && o.payment_methods) {
                    const methods = typeof o.payment_methods === 'string'
                        ? JSON.parse(o.payment_methods)
                        : o.payment_methods;

                    if (Array.isArray(methods)) {
                        methods.forEach((m: any, idx: number) => {
                            expandedOrderTransactions.push({
                                id: `order-${o.id}-part-${idx}`,
                                type: 'SALE',
                                amount: Number(m.amount),
                                payment_method: m.type, // 'money', 'card', 'pix'
                                description: `Pedido #${o.order_number || o.id} (${m.type})`,
                                created_at: o.created_at
                            });
                        });
                    }
                } else {
                    expandedOrderTransactions.push({
                        id: `order-${o.id}`,
                        type: 'SALE',
                        amount: o.total_amount,
                        payment_method: o.payment_method,
                        description: `Pedido #${o.order_number || o.id}`,
                        created_at: o.created_at
                    });
                }
            });

            const allTransactions = [...transactions, ...expandedOrderTransactions];

            return {
                cash_balance: cashBalance,
                card_balance: cardBalance,
                total_sales: totalSales,
                transactions: allTransactions // Passing this allows the existing UI to reduce() and get correct numbers
            };

        } catch (err) {
            console.error('Error getting summary:', err);
            return {
                cash_balance: 0,
                card_balance: 0,
                total_sales: 0,
                transactions: []
            };
        }
    };

    useEffect(() => {
        if (establishment?.id) {
            checkStatus();
        }
    }, [establishment?.id]);

    return (
        <CashierContext.Provider value={{ isCashierOpen, currentSession, openCashier, closeCashier, addTransaction, registerSale, getSummary, checkStatus }}>
            {children}
        </CashierContext.Provider>
    );
};

export const useCashier = () => useContext(CashierContext);
