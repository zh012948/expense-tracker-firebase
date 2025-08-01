import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { FaEdit, FaTrash } from 'react-icons/fa';

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
    const [budgetLoading, setBudgetLoading] = useState(false);
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
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
                    alert('User data not found. Please sign up or contact support.');
                }
            }, (error) => {
                console.error('Real-time listener error:', error);
                setError('Failed to load data in real-time. Please try again.');
                alert('Failed to load data in real-time. Please try again.');
            });
            return () => unsubscribe();
        }
    }, [navigate, loggedIn]);

    const updateBudget = async () => {
        const newBudget = parseInt(budget);
        if (isNaN(newBudget) || newBudget < 0) {
            setError('Please enter a valid budget amount.');
            alert('Please enter a valid budget amount.');

            return;
        }
        setError('');
        setBudgetLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userDocRef, { budget: newBudget });
            setBudget('');
        } catch (err) {
            console.error('Error updating budget:', err);
            setError('Failed to update budget. Please try again.');
            alert('Failed to update budget. Please try again.');
        } finally {
            setBudgetLoading(false);
        }
    };

    const addExpense = async () => {
        const newAmount = parseInt(newExpenseAmount);
        const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const remainingBudget = totalBudget - totalExpenses;

        if (!newExpenseName || isNaN(newAmount) || newAmount <= 0) {
            setError('Please enter valid expense name and amount.');
            alert('Please enter valid expense name and amount.');
            return;
        }
        if (newAmount > remainingBudget) {
            setError('Expense exceeds remaining budget!');
            alert('Expense exceeds remaining budget!');
            return;
        }
        setError('');
        setExpenseLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            const newExpenses = [...expenses, { name: newExpenseName, amount: newAmount, id: `${user.uid}_${Date.now()}` }];
            await updateDoc(userDocRef, { expenses: newExpenses });
            setNewExpenseName('');
            setNewExpenseAmount('');
            setEditExpenseId(null);
        } catch (err) {
            console.error('Error adding expense:', err);
            setError('Failed to add expense. Please try again.');
            alert('Failed to add expense. Please try again.');
        } finally {
            setExpenseLoading(false);
        }
    };

    const editExpense = async () => {
        const newAmount = parseInt(newExpenseAmount);
        const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const remainingBudget = totalBudget - totalExpenses;

        if (!newExpenseName || isNaN(newAmount) || newAmount <= 0) {
            setError('Please enter valid expense name and amount.');
            alert('Please enter valid expense name and amount.');
            return;
        }
        if (newAmount > remainingBudget + (expenses.find(exp => exp.id === editExpenseId)?.amount || 0)) {
            setError('Expense exceeds remaining budget!');
            alert('Expense exceeds remaining budget!');
            return;
        }
        setError('');
        setExpenseLoading(true);
        const user = auth.currentUser;
        if (!user || !editExpenseId) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            const newExpenses = expenses.map(exp =>
                exp.id === editExpenseId ? { ...exp, name: newExpenseName, amount: newAmount } : exp
            );
            await updateDoc(userDocRef, { expenses: newExpenses });
            setNewExpenseName('');
            setNewExpenseAmount('');
            setEditExpenseId(null);
        } catch (err) {
            console.error('Error editing expense:', err);
            setError('Failed to edit expense. Please try again.');
            alert('Failed to edit expense. Please try again.');
        } finally {
            setExpenseLoading(false);
        }
    };

    const deleteExpense = async (id: string | undefined) => {
        if (!id) return;
        setExpenseLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            const newExpenses = expenses.filter(exp => exp.id !== id);
            await updateDoc(userDocRef, { expenses: newExpenses });
        } catch (err) {
            console.error('Error deleting expense:', err);
            setError('Failed to delete expense. Please try again.');
            alert('Failed to delete expense. Please try again.');
        } finally {
            setExpenseLoading(false);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            await signOut(auth);
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('userName');
            navigate('/login', { replace: true });
        } catch (err) {
            console.error('Error logging out:', err);
            setError('Failed to log out. Please try again.');
            alert('Failed to log out. Please try again.');
        } finally {
            setLogoutLoading(false);
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
                            disabled={budgetLoading}
                        />
                        <button
                            onClick={updateBudget}
                            className="w-full mt-3 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                            disabled={budgetLoading}
                        >
                            {budgetLoading ? 'Updating...' : 'Update Budget'}
                        </button>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-lg transform hover:scale-105 transition duration-300">
                        <h2 className="text-xl font-semibold text-blue-600 mb-3">Add/Edit Expense</h2>
                        <input
                            type="text"
                            value={newExpenseName}
                            onChange={(e) => setNewExpenseName(e.target.value)}
                            placeholder="Expense Name"
                            className="w-full p-2 border-2 border-blue-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={expenseLoading}
                        />
                        <input
                            type="number"
                            value={newExpenseAmount}
                            onChange={(e) => setNewExpenseAmount(e.target.value)}
                            placeholder="Expense Amount"
                            className="w-full p-2 border-2 border-blue-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={expenseLoading}
                        />
                        <button
                            onClick={editExpenseId ? editExpense : addExpense}
                            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                            disabled={expenseLoading}
                        >
                            {expenseLoading ? (editExpenseId ? 'Saving...' : 'Adding...') : (editExpenseId ? 'Save Changes' : 'Add Expense')}
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
                <div className="bg-white p-4 rounded-xl shadow-lg mt-6 relative" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <h2 className="text-xl font-semibold text-blue-600 mb-3">Expense List</h2>
                    {error && <p className="text-red-500 mb-2">{error}</p>}
                    <ul className="space-y-2">
                        {expenses.map((expense) => (
                            <li key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                <span className="text-base text-gray-700">{expense.name}</span>
                                <span className="text-base text-gray-700">{expense.amount}</span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            const exp = expenses.find(e => e.id === expense.id);
                                            if (exp) {
                                                setNewExpenseName(exp.name);
                                                setNewExpenseAmount(exp.amount.toString());
                                                setEditExpenseId(exp.id || null); // Handle undefined id
                                            }
                                        }}
                                        className="text-blue-600 hover:text-blue-800 transition"
                                        disabled={expenseLoading}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => deleteExpense(expense.id)}
                                        className="text-red-500 hover:text-red-700 transition"
                                        disabled={expenseLoading}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Tracker;