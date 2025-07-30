// Tracker.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

interface UserData {
    email: string;
    budget: number;
    expenses: { name: string; amount: number }[];
    name?: string;
    budgetHistory?: number[];
}

const Tracker = () => {
    const navigate = useNavigate();
    const [budget, setBudget] = useState('');
    const [totalBudget, setTotalBudget] = useState(0);
    const [expenses, setExpenses] = useState<{ name: string; amount: number; id?: string }[]>([]);
    const [newExpenseName, setNewExpenseName] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');
    const [error, setError] = useState('');
    const [budgetLoading, setBudgetLoading] = useState(false); // Loading state for budget
    const [expenseLoading, setExpenseLoading] = useState(false); // Loading state for expense
    const [logoutLoading, setLogoutLoading] = useState(false); // Loading state for logout
    const loggedIn = localStorage.getItem('loggedIn');
    const userName = localStorage.getItem('userName') || 'User';

    useEffect(() => {
        if (!loggedIn || !auth.currentUser) {
            navigate('/login', { replace: true });
            return;
        }
        const user = auth.currentUser;
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data() as UserData;
                    setTotalBudget(userData.budget || 0);
                    setExpenses(userData.expenses?.map((exp, index) => ({ ...exp, id: `${user.uid}_${index}` })) || []);
                } else {
                    setError('User data not found. Please sign up or contact support.');
                }
            }, (error) => {
                console.error('Real-time listener error:', error);
                setError('Failed to load data in real-time. Please try again.');
            });
            return () => unsubscribe();
        }
    }, [navigate, loggedIn]);

    const updateBudget = async () => {
        const newBudget = parseInt(budget);
        if (isNaN(newBudget) || newBudget < 0) {
            setError('Please enter a valid budget amount.');
            return;
        }
        setError('');
        setBudgetLoading(true); // Set loading to true
        const user = auth.currentUser;
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            const userDoc = await getDoc(userDocRef);
            const userData = userDoc.data() as UserData;
            const newBudgetHistory = userData.budgetHistory ? [...userData.budgetHistory, totalBudget] : [totalBudget];
            await updateDoc(userDocRef, { budget: newBudget, budgetHistory: newBudgetHistory });
            setBudget('');
        } catch (err) {
            console.error('Error updating budget:', err);
            setError('Failed to update budget. Please try again.');
        } finally {
            setBudgetLoading(false); // Reset loading state
        }
    };

    const addExpense = async () => {
        const newAmount = parseInt(newExpenseAmount);
        const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const remainingBudget = totalBudget - totalExpenses;

        if (!newExpenseName || isNaN(newAmount) || newAmount <= 0) {
            setError('Please enter valid expense name and amount.');
            return;
        }
        if (newAmount > remainingBudget) {
            setError('Expense exceeds remaining budget!');
            return;
        }
        setError('');
        setExpenseLoading(true); // Set loading to true
        const user = auth.currentUser;
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            const newExpenses = [...expenses, { name: newExpenseName, amount: newAmount, id: `${user.uid}_${Date.now()}` }];
            await updateDoc(userDocRef, { expenses: newExpenses });
            setNewExpenseName('');
            setNewExpenseAmount('');
        } catch (err) {
            console.error('Error adding expense:', err);
            setError('Failed to add expense. Please try again.');
        } finally {
            setExpenseLoading(false); // Reset loading state
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true); // Set loading to true
        try {
            await signOut(auth);
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('userName');
            navigate('/login', { replace: true });
        } catch (err) {
            console.error('Error logging out:', err);
            setError('Failed to log out. Please try again.');
        } finally {
            setLogoutLoading(false); // Reset loading state
        }
    };

    const balance = totalBudget - expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6" style={{ height: '100vh', overflowY: 'auto' }}>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Expense Tracker</h1>
                    <div>
                        <p className="text-lg text-gray-600">Welcome, {userName}</p>
                        <button
                            onClick={handleLogout}
                            className="mt-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                            disabled={logoutLoading}
                        >
                            {logoutLoading ? 'Logging out...' : 'Logout'}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <div className="bg-white p-4 rounded-xl shadow-lg transform hover:scale-105 transition duration-300">
                        <h2 className="text-xl font-semibold text-blue-600 mb-3">Set Budget</h2>
                        <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="Enter Total Budget"
                            className="w-full p-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={budgetLoading} // Disable input during loading
                        />
                        <button
                            onClick={updateBudget}
                            className="w-full mt-3 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                            disabled={budgetLoading} // Disable button during loading
                        >
                            {budgetLoading ? 'Updating...' : 'Update Budget'}
                        </button>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-lg transform hover:scale-105 transition duration-300">
                        <h2 className="text-xl font-semibold text-blue-600 mb-3">Add Expense</h2>
                        <input
                            type="text"
                            value={newExpenseName}
                            onChange={(e) => setNewExpenseName(e.target.value)}
                            placeholder="Expense Name"
                            className="w-full p-2 border-2 border-blue-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={expenseLoading} // Disable input during loading
                        />
                        <input
                            type="number"
                            value={newExpenseAmount}
                            onChange={(e) => setNewExpenseAmount(e.target.value)}
                            placeholder="Expense Amount"
                            className="w-full p-2 border-2 border-blue-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={expenseLoading} // Disable input during loading
                        />
                        <button
                            onClick={addExpense}
                            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                            disabled={expenseLoading} // Disable button during loading
                        >
                            {expenseLoading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold">Total Budget</h3>
                        <p className="text-xl">{totalBudget || 0}</p>
                    </div>
                    <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold">Total Expenses</h3>
                        <p className="text-xl">{expenses.reduce((acc, curr) => acc + curr.amount, 0)}</p>
                    </div>
                    <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold">Remaining Balance</h3>
                        <p className="text-xl" style={{ color: balance < totalBudget * 0.2 && balance > 0 ? 'orange' : balance < 0 ? 'red' : 'white' }}>
                            {balance >= 0 ? balance : 0}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg mt-6">
                    <h2 className="text-xl font-semibold text-blue-600 mb-3">Expense List</h2>
                    {error && <p className="text-red-500 mb-2">{error}</p>}
                    <ul className="space-y-2">
                        {expenses.map((expense) => (
                            <li key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                <span className="text-base text-gray-700">{expense.name}</span>
                                <span className="text-base text-gray-700">{expense.amount}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Tracker;