
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, PlusCircle, TrendingUp, TrendingDown, IndianRupee, Calendar as CalendarIcon, Filter, Search, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { format, getYear, getMonth } from 'date-fns';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/components/CustomComponents/apiRequest'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ExpenseManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    // const [masters, setMasters] = useState([]);
    const [masters, setMasters] = useState({ patients: [], physio: [], machines: [], references: [] });
    console.log(masters, "masters")
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTx, setEditingTx] = useState(null);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth()).toString()); // 0-indexed
    const { getPermissionsByPath } = useAuth();
    const [Permissions, setPermissions] = useState({ isAdd: false, isView: false, isEdit: false, isDelete: false })

    const [filterState, setFilterState] = useState({

        categories: '',
        linkedEntity: {},
        year: new Date().getFullYear().toString(),
        month: 'all'
    });
    const [advancedFilteredTransactions, setAdvancedFilteredTransactions] = useState(null);

    const initialFormState = {
        ExpenseTypeID: "",
        ExpenseTypeName: "",
        ExpenseCategoryId: "",
        ExpenseCategoryName: "",
        expenseDate: new Date(),
        expenseAmount: "",
        PhysioId: "",
        physioName: '',
        physioDescription: "",
        officeExpDes: "",
        ReferenceId: "",
        PatientId: "",
        referenceDes: "",
        MachineiId: "",
        machineDes: "",
        otherDescription: "",
        linkedEntity: {}

        // type: 'Expense',
        // date: new Date(),
        // amount: '',
        // categoryId: '',
        // description: '',
    };
    const [formState, setFormState] = useState(initialFormState);
    console.log(initialFormState, "initialFormState")
    const [expense, SetExpense] = useState([])
    const [expenseType, SetExpenseType] = useState([])
    const [expenseCategory, setExpenseCategory] = useState([])
    const [physio, setPhysio] = useState([])


    useEffect(() => {

        getAllPhysio(),
            getExpenseType(),
            getAllExpenseCategory(),
            getAllReference(),
            getAllPatient(),
            getAllMachie()
    }, [])


    useEffect(() => {
        getPermissionsByPath(window.location.pathname).then(res => {
            if (res) {
                console.log(res, "res")
                setPermissions(res)
            } else {
                navigate('/dashboard')
            }
        })
      
    }, [])

     useEffect(()=>{
          if (Permissions.isView) {
          getExpense()
          }
      },[Permissions])


    const getExpense = async (data) => {
        try {
            const response = await apiRequest("Expense/getAllExpense", {
                method: 'POST',
                body: JSON.stringify(data),
            });
            SetExpense(response)
            return response
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }

    }


    const createExpense = async (data) => {
        try {
            const response = await apiRequest("Expense/createExpense", {
                method: 'POST',
                body: JSON.stringify(data),
            });
            getExpense()
            return response
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }


    const getAllPhysio = async (data) => {
        try {
            const response = await apiRequest("Physio/getAllPhysio", {
                method: 'POST',
                body: JSON.stringify(data),
            });
            getExpense()
            setMasters(prev => ({ ...prev, physio: response.physios }))
            // setMasters(response)

        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    const getExpenseType = async (data) => {
        try {
            const response = await apiRequest("ExpenseType/getAllExpenseType", {
                method: 'POST',
                body: JSON.stringify(data),
            });
            getExpense()
            SetExpenseType(response)

        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    const getAllExpenseCategory = async (data) => {
        try {
            const response = await apiRequest("ExpenseCategory/getAllExpenseCategory", {
                method: 'POST',
                body: JSON.stringify(data),
            });
            getExpense()
            setExpenseCategory(response)
            setCategories(response)
            // setMasters(response)
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    const getAllReference = async (data) => {
        try {
            const response = await apiRequest("References/getALLReferences", {
                method: 'POST',
                body: JSON.stringify(data),
            });
            getExpense()
            setMasters(prev => ({ ...prev, references: response }))

            // setMasters(response)
            return response
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }



    const getAllPatient = async (data) => {
        try {
            const response = await apiRequest("Patient/getAllPatient", {
                method: 'POST',
                body: JSON.stringify(data),
            });
            getExpense()
            setMasters(prev => ({ ...prev, patients: response }))

            // setMasters(response)

        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    const getAllMachie = async (data) => {
        try {
            const response = await apiRequest("Machinery/getAllMachinery", {
                method: 'POST',
                body: JSON.stringify(data),
            });
            getExpense()
            setMasters(prev => ({ ...prev, machines: response }))

            // setMasters(response)

        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const [txRes, catRes, patRes, phyRes, macRes, refRes] = await Promise.all([
    //                 fetch('/mockdata/transactions.json'),
    //                 fetch('/mockdata/categories.json'),
    //                 fetch('/mockdata/patients.json'),
    //                 fetch('/mockdata/physios.json'),
    //                 fetch('/mockdata/machines.json'),
    //                 fetch('/mockdata/references.json'),
    //             ]);
    //             const txData = await txRes.json();
    //             setTransactions(txData);
    //             setCategories(await catRes.json());
    //             setMasters({
    //                 patients: await patRes.json(),
    //                 physios: await phyRes.json(),
    //                 machines: await macRes.json(),
    //                 references: await refRes.json(),
    //             });
    //         } catch (error) {
    //             console.error("Failed to fetch data", error);
    //             toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    //         }
    //     };
    //     fetchData();
    // }, []);

    const handleFormChange = (name, value) => {
        if (name.startsWith('linkedEntity.')) {
            const key = name.split('.')[1];
            setFormState(prev => ({ ...prev, linkedEntity: { ...prev.linkedEntity, [key]: value } }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFilterChange = (name, value) => {
        if (name.startsWith('linkedEntity.')) {
            const key = name.split('.')[1];
            setFilterState(prev => ({ ...prev, linkedEntity: { ...prev.linkedEntity, [key]: value } }));
        } else {
            setFilterState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelectChange = (name, value) => {
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const openNewDialog = () => {
        setEditingTx(null);
        setFormState(initialFormState);
        setIsFormOpen(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const selectedCategory = categories.find(c => c.id === parseInt(formState.ExpenseCategoryId));
        const newTransaction = {
            id: editingTx ? editingTx.id : Date.now(),
            createdBy: user.name,
            ...formState,
            amount: parseFloat(formState.amount) || 0,
            category: selectedCategory.name,
            ExpenseCategoryId: parseInt(formState.ExpenseCategoryId),
            date: format(formState.date, 'yyyy-MM-dd'),
        };

        if (editingTx) {
            setTransactions(prev => prev.map(tx => tx.id === editingTx.id ? newTransaction : tx));
            toast({ title: "Success", description: "Transaction updated." });
        } else {
            setTransactions(prev => [newTransaction, ...prev]);
            toast({ title: "Success", description: "New transaction added." });
        }
        setIsFormOpen(false);
    };

    const handleApplyAdvancedFilter = () => {
        let filtered = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const yearMatch = getYear(txDate).toString() === filterState.year;
            const monthMatch = filterState.month === 'all' || getMonth(txDate).toString() === filterState.month;
            return tx.type === 'Expense' && yearMatch && monthMatch;
        });

        if (filterState.categories) {
            filtered = filtered.filter(tx => tx.categories.toString() === filterState.categories);
        }

        const linkedEntityFilters = Object.entries(filterState.linkedEntity).filter(([_, value]) => value);
        if (linkedEntityFilters.length > 0) {
            filtered = filtered.filter(tx => {
                if (!tx.linkedEntity) return false;
                return linkedEntityFilters.every(([key, value]) => {
                    return tx.linkedEntity[key] === value;
                });
            });
        }

        setAdvancedFilteredTransactions(filtered);
        toast({ title: "Filter Applied", description: `Found ${filtered.length} transactions.` });
    };

    const clearAdvancedFilter = () => {
        setFilterState({
            categories: '',
            linkedEntity: {},
            year: new Date().getFullYear().toString(),
            month: 'all'
        });
        setAdvancedFilteredTransactions(null);
    }

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const yearMatch = getYear(txDate).toString() === selectedYear;
            const monthMatch = getMonth(txDate).toString() === selectedMonth;
            return yearMatch && monthMatch;
        });
    }, [transactions, selectedYear, selectedMonth]);

    const incomeTransactions = useMemo(() => filteredTransactions.filter(t => t.type === 'Income'), [filteredTransactions]);
    const expenseTransactions = useMemo(() => filteredTransactions.filter(t => t.type === 'Expense'), [filteredTransactions]);

    const totalIncome = useMemo(() => incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0), [incomeTransactions]);
    const totalExpense = useMemo(() => expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0), [expenseTransactions]);
    const netBalance = totalIncome - totalExpense;

    const advancedFilterTotal = useMemo(() => {
        if (!advancedFilteredTransactions) return 0;
        return advancedFilteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    }, [advancedFilteredTransactions]);

    const renderDynamicFields = (state, handler, isFilter = false) => {
        // const category = categories.find(c => c.id === parseInt(state.categoryId));
        const category = formState.ExpenseCategoryName
        if (!category) return null;

        const commonFields = !isFilter ? (
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={state.description || ''} onChange={(e) => handler('description', e.target.value)} required />
            </div>
        ) : null;

        const onValueChange = (val, name) => handler(name, val);

        switch (category) {
            case 'Revenue from Patient':
                return <>
                    <div className="space-y-2">
                        <Label>Patient Name</Label>
                        <Select value={state.linkedEntity?.patientName || ''} onValueChange={(val) => onValueChange(val, 'linkedEntity.patientName')}>
                            <SelectTrigger><SelectValue placeholder="Select Patient" /></SelectTrigger>
                            <SelectContent>{masters.patients.map(p => <SelectItem key={p.id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {commonFields}
                </>;
            case 'Other Income':
                return <>
                    <div className="space-y-2">
                        <Label>Source Name</Label>
                        <Input value={state.linkedEntity?.sourceName || ''} onChange={(e) => handler('linkedEntity.sourceName', e.target.value)} placeholder="e.g. Asset Sale" />
                    </div>
                    {commonFields}
                </>;
            case 'Physio Salary':
                return <>
                    <div className="space-y-2">
                        <Label>Physio Name</Label>
                        <Select value={state.linkedEntity?.physioName || ''} onValueChange={(val) => onValueChange(val, 'linkedEntity.physioName')}>
                            <SelectTrigger><SelectValue placeholder={isFilter ? "All Physio" : "Select Physio"} /></SelectTrigger>
                            <SelectContent>{(masters.physio || []).map(p => <SelectItem key={p.id} value={p.id}>{p.physioName}</SelectItem>)}</SelectContent>
                        </Select>



                    </div>
                    {commonFields}
                </>;
            case 'Machine Maintenance':
                return <>
                    {/* <div className="space-y-2">
                        <Label>Machine</Label>
                        <Select value={state.linkedEntity?.machineName || ''} onValueChange={(val) => onValueChange(val, 'linkedEntity.machineName')}>
                            <SelectTrigger><SelectValue placeholder={isFilter ? "All Machines" : "Select Machine"} /></SelectTrigger>
                            <SelectContent>{(masters.machines || []).map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div> */}
                    <div className="space-y-2">
                        <Label>Machine</Label>
                        <Select value={state.linkedEntity?.machineName || ''} onValueChange={(val) => onValueChange(val, 'linkedEntity.machineName')}>
                            <SelectTrigger><SelectValue placeholder={isFilter ? "All Machines" : "Select Machine"} /></SelectTrigger>
                            <SelectContent>{(masters.machines || []).map(m => <SelectItem key={m.id} value={m.name}>{m.machineName}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {commonFields}
                </>;
            case 'Referral Commission':
                return <>
                    <div className="space-y-2">
                        <Label>Reference Name</Label>
                        <Select value={state.linkedEntity?.sourceName || ''} onValueChange={(val) => onValueChange(val, 'linkedEntity.sourceName')}>
                            <SelectTrigger><SelectValue placeholder={isFilter ? "All References" : "Select Reference"} /></SelectTrigger>
                            <SelectContent>{(masters.references || []).map(r => <SelectItem key={r.id} value={r.name}>{r.sourceName}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Patient Name</Label>
                        <Select value={state.linkedEntity?.patientName || ''} onValueChange={(val) => onValueChange(val, 'linkedEntity.patientName')}>
                            <SelectTrigger><SelectValue placeholder={isFilter ? "All Patients" : "Select Patient"} /></SelectTrigger>
                            <SelectContent>{(masters.patients || []).map(p => <SelectItem key={p.id} value={p.name}>{p.patientName}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {commonFields}
                </>;
            default:
                return commonFields;
        }
    };

    const TransactionTable = ({ data, type }) => (
        <div className="table-responsive-wrapper">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="p-3 text-left font-semibold text-gray-600">Date</th>
                        <th className="p-3 text-left font-semibold text-gray-600">Category</th>
                        <th className="p-3 text-left font-semibold text-gray-600">Description</th>
                        <th className="p-3 text-right font-semibold text-gray-600">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(tx => (
                        <tr key={tx.id} className="border-b hover:bg-gray-50/50">
                            <td className="p-3 text-gray-700">{format(new Date(tx.date), 'dd MMM, yyyy')}</td>
                            <td className="p-3 text-gray-700">{tx.category}</td>
                            <td className="p-3 text-gray-500 max-w-xs truncate">{tx.description}</td>
                            <td className={`p-3 text-right font-medium ${type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{tx.amount.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const expenseByCategory = useMemo(() => {
        const data = expenseTransactions.reduce((acc, tx) => {
            acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
            return acc;
        }, {});
        return {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#3b82f6', '#ef4444', '#f97316', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1'],
            }],
        };
    }, [expenseTransactions]);

    const yearOptions = useMemo(() => {
        const years = new Set(transactions.map(tx => getYear(new Date(tx.date))));
        if (!years.has(new Date().getFullYear())) {
            years.add(new Date().getFullYear());
        }
        return Array.from(years).sort((a, b) => b - a).map(String);
    }, [transactions]);

    const monthOptions = [
        { value: 'all', label: 'All Months' },
        { value: '0', label: 'January' }, { value: '1', label: 'February' }, { value: '2', label: 'March' }, { value: '3', label: 'April' }, { value: '4', label: 'May' }, { value: '5', label: 'June' }, { value: '6', label: 'July' }, { value: '7', label: 'August' }, { value: '8', label: 'September' }, { value: '9', label: 'October' }, { value: '10', label: 'November' }, { value: '11', label: 'December' },
    ];

    const reportMonthOptions = monthOptions.filter(m => m.value !== 'all');

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Wallet size={30} /> Expense Management</h1>
                    <p className="text-gray-600 mt-1">Track all income and expenses in one place.</p>
                </div>
                {
                    Permissions.isAdd && <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl transition-shadow">
                    <PlusCircle size={18} className="mr-2" /> Add Transaction
                </Button>
                }
                {/* <Button onClick={openNewDialog} className="shadow-lg shadow-blue-500/20 hover:shadow-xl transition-shadow">
                    <PlusCircle size={18} className="mr-2" /> Add Transaction
                </Button> */}
            </motion.div>

            <Tabs defaultValue="monthly_report">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="monthly_report">Monthly Report</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="expense_chart">Expense Chart</TabsTrigger>
                    <TabsTrigger value="advanced_filter">Advanced Filter</TabsTrigger>
                </TabsList>
                <TabsContent value="monthly_report">
                    <Card>
                        <CardHeader className="flex-row items-center space-x-4 space-y-0">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-gray-500" />
                                <h3 className="text-lg font-semibold">Report Filters</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="year-select">Year:</Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger id="year-select" className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{yearOptions.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="month-select">Month:</Label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger id="month-select" className="w-[180px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>{reportMonthOptions.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Monthly Income</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</div></CardContent></Card>
                        <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Monthly Expense</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</div></CardContent></Card>
                        <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Monthly Net</CardTitle><IndianRupee className={`h-4 w-4 ${netBalance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} /></CardHeader><CardContent><div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>₹{netBalance.toLocaleString()}</div></CardContent></Card>
                    </div>
                </TabsContent>
                <TabsContent value="expenses"><Card><CardHeader><CardTitle>Expense Records</CardTitle><CardDescription>Showing transactions for {reportMonthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardDescription></CardHeader><CardContent><TransactionTable data={expenseTransactions} type="Expense" /></CardContent></Card></TabsContent>
                <TabsContent value="income"><Card><CardHeader><CardTitle>Income Records</CardTitle><CardDescription>Showing transactions for {reportMonthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardDescription></CardHeader><CardContent><TransactionTable data={incomeTransactions} type="Income" /></CardContent></Card></TabsContent>
                <TabsContent value="expense_chart">
                    <Card>
                        <CardHeader><CardTitle>Expense Breakdown</CardTitle><CardDescription>Expenses by category for {reportMonthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardDescription></CardHeader>
                        <CardContent className="flex justify-center items-center" style={{ height: '300px' }}>
                            {expenseTransactions.length > 0 ? <Pie data={expenseByCategory} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} /> : <p className="text-gray-500">No expense data for the selected period.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="advanced_filter">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Search /> Advanced Expense Filter</CardTitle>
                            <CardDescription>Drill down into your expenses with specific criteria.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border rounded-lg bg-gray-50/50 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label>Year</Label><Select value={filterState.year} onValueChange={(val) => handleFilterChange('year', val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{yearOptions.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label>Month</Label><Select value={filterState.month} onValueChange={(val) => handleFilterChange('month', val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{monthOptions.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-2"><Label>Category</Label><Select value={filterState.ExpenseCategoryId} onValueChange={(val) => { handleFilterChange('ExpenseCategoryId', val); handleFilterChange('linkedEntity', {}) }}><SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent>{categories.filter(c => c.type === 'Expense' && c.status === 'Active').map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderDynamicFields(filterState, handleFilterChange, true)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleApplyAdvancedFilter}>Apply Filter</Button>
                                <Button variant="outline" onClick={clearAdvancedFilter}>Clear Filter</Button>
                            </div>
                        </CardContent>
                    </Card>
                    {advancedFilteredTransactions && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Filtered Results</CardTitle>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-center gap-3 rounded-lg border p-4">
                                        <FileText className="h-6 w-6 text-blue-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Transactions</p>
                                            <p className="text-xl font-bold">{advancedFilteredTransactions.length}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-lg border p-4">
                                        <TrendingDown className="h-6 w-6 text-red-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Expense</p>
                                            <p className="text-xl font-bold text-red-600">₹{advancedFilterTotal.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {advancedFilteredTransactions.length > 0 ? (
                                    <TransactionTable data={advancedFilteredTransactions} type="Expense" />
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No transactions found matching your criteria.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingTx ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
                        <DialogDescription>Fill in the details for the transaction.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">


                            <Select
                                value={formState.ExpenseTypeID ? JSON.stringify({ id: formState.ExpenseTypeID, name: formState.ExpenseTypeName }) : ''}
                                onValueChange={(v) => {
                                    const selected = JSON.parse(v);
                                    handleSelectChange('ExpenseTypeID', selected.id);
                                    handleSelectChange('ExpenseTypeName', selected.name);
                                }}
                            >  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>
                                    {expenseType.map((exp) => (
                                        <SelectItem
                                            key={exp._id}
                                            value={JSON.stringify({ id: exp._id, name: exp.ExpenseTypeName })}
                                        >{exp.ExpenseTypeName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* <div className="space-y-2"><Label>Type</Label><Select value={formState.type} onValueChange={(val) => handleFormChange('type', val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Expense">Expense</SelectItem><SelectItem value="Income">Income</SelectItem></SelectContent></Select></div> */}
                            <div className="space-y-2"><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{formState.expenseDate ? format(formState.expenseDate, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formState.expenseDate} onSelect={(val) => handleFormChange('date', val)} initialFocus /></PopoverContent></Popover></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="expenseAmount">Amount (₹)</Label><Input id="expenseAmount" type="number" value={formState.expenseAmount} onChange={(e) => handleFormChange('expenseAmount', e.target.value)} required min="0.01" step="0.01" /></div>

                            {
                                formState.ExpenseTypeName == 'Expenses' ?
                                    <div className="space-y-2"><Label htmlFor="ExpenseCategoryId">Select Categories</Label>
                                        <Select
                                            value={formState.ExpenseCategoryId ? JSON.stringify({ id: formState.ExpenseCategoryId, name: formState.ExpenseCategoryName }) : ''}
                                            onValueChange={(v) => {
                                                const selected = JSON.parse(v);
                                                handleSelectChange('ExpenseCategoryId', selected.id);
                                                handleSelectChange('ExpenseCategoryName', selected.name);
                                            }}
                                        >  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                                            <SelectContent>
                                                {expenseCategory.map((expCate) => (
                                                    <SelectItem
                                                        key={expCate._id}
                                                        value={JSON.stringify({ id: expCate._id, name: expCate.ExpenseCategoryName })}
                                                    >{expCate.ExpenseCategoryName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {/* <div className="space-y-2"><Label>Category</Label><Select value={formState.categoryId} onValueChange={(val) => { handleFormChange('categoryId', val); handleFormChange('linkedEntity', {}) }}><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent>{categories.filter(c => c.type === formState.type && c.status === 'Active').map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select></div> */}
                                    </div> : null

                            }

                        </div>
                        {renderDynamicFields(formState, handleFormChange)}
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit">{editingTx ? 'Save Changes' : 'Add Transaction'}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ExpenseManagement;
