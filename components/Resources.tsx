import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './ui/Layout';
import Input from './ui/Input';
import Select from './ui/Select';
import PasswordConfirmModal from './ui/PasswordConfirmModal';
import { useAuth } from '../AuthContext';
import { 
    ChevronLeft, 
    FileText, 
    Search, 
    Clock, 
    ChevronRight,
    ExternalLink,
    BadgeInfo,
    ArrowLeft,
    Plus,
    X,
    Loader2,
    Save,
    Edit3,
    Trash2,
    Printer,
    Info,
    Stethoscope,
    BookMarked
} from 'lucide-react';
import { getReferences, submitReference, updateReference, getPocketGuides, submitPocketGuide, updatePocketGuide, deleteRecord } from '../services/ipcService';

interface Resource {
    id: string;
    title: string;
    category: string;
    updated: string;
    description: string; 
    type: 'link' | 'pocket';
    content?: string;
    link?: string;
}

const REFERENCE_CATEGORIES = [
    "Clinical Pathways",
    "Clinical Practice Guidelines",
    "Evidence Summaries",
    "WHO Technical Reports",
    "DOH Administrative Orders",
    "Others (Specify)"
];

const POCKET_GUIDE_CATEGORIES = [
    "Clinical Management",
    "Isolation Protocols",
    "Antibiotic Stewardship",
    "Emergency Procedures",
    "Others (Specify)"
];

const PocketCardViewer: React.FC<{ guide: Resource; onClose: () => void }> = ({ guide, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const sections = useMemo(() => {
        if (!guide.content) return [];
        const lines = guide.content.split('\n');
        const result: { title: string; items: string[] }[] = [];
        let currentSection = { title: '', items: [] as string[] };

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (/^\d+\./.test(trimmed) || trimmed.startsWith('###') || (trimmed.toUpperCase() === trimmed && trimmed.length > 5)) {
                if (currentSection.title || currentSection.items.length > 0) {
                    result.push({ ...currentSection });
                }
                currentSection = { 
                    title: trimmed.replace(/^###\s*\**|^\d+\.\s*|\**$/g, '').trim(), 
                    items: [] 
                };
            } else {
                currentSection.items.push(trimmed.replace(/^\*\s*|^\-\s*/g, '').trim());
            }
        });
        
        if (currentSection.title || currentSection.items.length > 0) {
            result.push(currentSection);
        }
        return result;
    }, [guide.content]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-20 print:p-0 print:m-0">
            <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-10 border-b border-slate-200 -mx-4 px-4 print:hidden">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-amber-600 transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button 
                    onClick={handlePrint}
                    className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                    <Printer size={14} /> Print Card
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300 print:rounded-none">
                <div className="bg-amber-600 p-10 text-white">
                    <div className="flex justify-between items-start gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-200/80">Clinical Pocket Guide</span>
                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-tight">{guide.title}</h1>
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-100/90 mt-2 bg-black/10 w-fit px-3 py-1 rounded-full border border-white/10">
                                <Info size={14} className="shrink-0" /> {guide.description}
                            </div>
                        </div>
                        <div className="p-4 bg-white/15 rounded-[1.5rem] shrink-0 backdrop-blur-sm border border-white/20">
                            <Stethoscope size={36} />
                        </div>
                    </div>
                </div>

                <div className="p-10 md:p-12 flex flex-col gap-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
                    {sections.length === 0 ? (
                        <p className="text-slate-700 font-medium leading-relaxed text-lg whitespace-pre-wrap">{guide.content}</p>
                    ) : (
                        sections.map((section, sIdx) => (
                            <div key={sIdx} className="flex flex-col gap-5">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-amber-600/20">{sIdx + 1}</div>
                                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 border-b-4 border-amber-500/10 flex-1 pb-1.5">{section.title}</h2>
                                </div>
                                <div className="flex flex-col gap-4 ml-14">
                                    {section.items.map((item, iIdx) => {
                                        const isMainPoint = item.toUpperCase() === item && item.length > 5;
                                        return (
                                            <div key={iIdx} className="flex gap-4 group">
                                                <div className={`size-2 rounded-full mt-2 shrink-0 ${isMainPoint ? 'bg-amber-600' : 'bg-slate-300'}`}></div>
                                                <p className={`text-base leading-relaxed ${isMainPoint ? 'font-black text-slate-950 uppercase tracking-tight text-sm' : 'font-medium text-slate-600'}`}>
                                                    {item}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-slate-50 border-t border-slate-100 p-8 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Institutional Protocol</span>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{guide.updated} • Ospital ng Makati IPC Hub</span>
                    </div>
                    <div className="size-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-200">
                        <BookMarked size={24} />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface Props {
    title?: string;
    type?: 'policies' | 'pathways' | 'pocket-guides';
    isNested?: boolean;
}

const Resources: React.FC<Props> = ({ title, type, isNested }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user, validatePassword } = useAuth();
    const [search, setSearch] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<Resource | null>(null);
    const [dbItems, setDbItems] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Secure deletion state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Resource | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    const [newRef, setNewRef] = useState({
        title: '',
        description: '',
        link: '',
        category: '',
        categoryOther: '',
        content: ''
    });

    const [editingItemData, setEditingItemData] = useState<any>(null);

    const resourceType = type || 'pathways';

    useEffect(() => {
        loadData();
    }, [resourceType]);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchFunc = resourceType === 'pocket-guides' ? getPocketGuides : getReferences;
            const res = await fetchFunc();
            const mapped: Resource[] = res.map((r: any) => ({
                id: r.id,
                title: r.title,
                category: r.category,
                updated: r.created_at?.toDate ? r.created_at.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently',
                description: r.description,
                type: resourceType === 'pocket-guides' ? 'pocket' : 'link',
                link: r.link,
                content: r.content
            }));
            setDbItems(mapped);
        } catch (e) {
            console.error("Error loading resources:", e);
        } finally {
            setLoading(false);
        }
    };

    const items = useMemo(() => dbItems, [dbItems]);
    
    const filteredItems = items.filter(i => 
        i.title.toLowerCase().includes(search.toLowerCase()) || 
        i.category.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase())
    );

    const handleAction = (item: Resource) => {
        if (item.type === 'pocket') {
            setSelectedDoc(item);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (item.link) {
            window.open(item.link, '_blank');
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const category = newRef.category === 'Others (Specify)' ? newRef.categoryOther : newRef.category;
        
        const submitFunc = resourceType === 'pocket-guides' ? submitPocketGuide : submitReference;
        const payload: any = {
            title: newRef.title,
            description: newRef.description,
            category,
            content: newRef.content,
            link: newRef.link
        };

        const success = await submitFunc(payload);

        if (success) {
            setShowAddModal(false);
            setNewRef({ title: '', description: '', link: '', category: '', categoryOther: '', content: '' });
            loadData();
        } else {
            alert("Failed to save resource.");
        }
        setLoading(false);
    };

    const handleEditClick = (item: Resource) => {
        const categories = resourceType === 'pocket-guides' ? POCKET_GUIDE_CATEGORIES : REFERENCE_CATEGORIES;
        const isStandardCategory = categories.includes(item.category);
        setEditingItemData({
            id: item.id,
            title: item.title,
            link: item.link || '',
            description: item.description,
            content: item.content || '',
            category: isStandardCategory ? item.category : 'Others (Specify)',
            categoryOther: isStandardCategory ? '' : item.category
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const category = editingItemData.category === 'Others (Specify)' ? editingItemData.categoryOther : editingItemData.category;
        
        const updateFunc = resourceType === 'pocket-guides' ? updatePocketGuide : updateReference;
        const payload: any = {
            id: editingItemData.id,
            title: editingItemData.title,
            description: editingItemData.description,
            category,
            content: editingItemData.content,
            link: editingItemData.link
        };

        const success = await updateFunc(payload);

        if (success) {
            setShowEditModal(false);
            setEditingItemData(null);
            loadData();
        } else {
            alert("Failed to update resource.");
        }
        setLoading(false);
    };

    const handleDeleteClick = (item: Resource) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async (password: string) => {
        if (!itemToDelete || !user) return;
        setPasswordConfirmLoading(true);
        if (!validatePassword(user, password)) {
            alert("Incorrect password.");
            setPasswordConfirmLoading(false);
            return;
        }
        try {
            const col = resourceType === 'pocket-guides' ? 'clinical_pocket_guides' : 'clinical_references';
            const success = await deleteRecord(col, itemToDelete.id);
            if (success) {
                loadData();
                setShowDeleteConfirm(false);
                setItemToDelete(null);
            } else {
                alert("Failed to delete.");
            }
        } finally {
            setPasswordConfirmLoading(false);
        }
    };

    if (selectedDoc) {
        return <PocketCardViewer guide={selectedDoc} onClose={() => setSelectedDoc(null)} />;
    }

    const ListView = (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {!isNested && (
                        <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-emerald-600 font-bold">
                            <ChevronLeft size={16} /> Hub
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <BadgeInfo size={16} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            {filteredItems.length} resources listed
                        </span>
                    </div>
                    {isAuthenticated && (
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className={`h-10 px-6 ${resourceType === 'pocket-guides' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-black'} text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center gap-2`}
                        >
                            <Plus size={14}/> Add {resourceType === 'pocket-guides' ? 'Pocket Guide' : 'Reference'}
                        </button>
                    )}
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 ${resourceType === 'pocket-guides' ? 'focus:ring-amber-500' : 'focus:ring-slate-900'} outline-none shadow-sm transition-all font-medium`}
                        placeholder={`Search ${title || 'Resources'}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" size={48} /></div>
                ) : filteredItems.length === 0 ? (
                    <div className="col-span-full p-20 text-center bg-white border border-dashed border-slate-200 rounded-[2rem]">
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No resources found in this category</p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => handleAction(item)}
                            className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl ${resourceType === 'pocket-guides' ? 'hover:border-amber-500' : 'hover:border-slate-900'} transition-all group flex flex-col relative overflow-hidden cursor-pointer h-full`}
                        >
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                    <span className={`text-[8px] md:text-[10px] font-black uppercase ${resourceType === 'pocket-guides' ? 'text-amber-600' : 'text-slate-400'} tracking-widest block truncate`}>{item.category}</span>
                                    <h3 className={`font-black text-sm md:text-xl text-slate-900 mt-0.5 ${resourceType === 'pocket-guides' ? 'group-hover:text-amber-600' : 'group-hover:text-slate-900'} transition-colors leading-tight truncate`}>{item.title}</h3>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {isAuthenticated && (
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                className={`p-1.5 md:p-2 text-slate-300 ${resourceType === 'pocket-guides' ? 'hover:text-amber-600 hover:bg-amber-50' : 'hover:text-slate-900 hover:bg-slate-50'} rounded-lg transition-all`}
                                                title="Edit"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                className="p-1.5 md:p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                    <div className={`p-1.5 md:p-3 ${resourceType === 'pocket-guides' ? 'bg-amber-50 group-hover:bg-amber-100 text-amber-400' : 'bg-slate-50 group-hover:bg-slate-100 text-slate-400'} rounded-lg md:rounded-2xl transition-colors`}>
                                        {item.type === 'pocket' ? <BookMarked size={22} /> : <ExternalLink size={22} />}
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                                {item.description}
                            </p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className="text-[7px] md:text-[9px] font-black text-slate-300 flex items-center gap-1 uppercase tracking-widest">
                                    <Clock size={10}/> {item.updated}
                                </span>
                                <div className={`flex items-center gap-1 text-[8px] md:text-xs font-black uppercase tracking-widest ${resourceType === 'pocket-guides' ? 'text-amber-700' : 'text-slate-900'}`}>
                                    {item.type === 'pocket' ? 'View Pocket Card' : 'Open Reference'}
                                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <PasswordConfirmModal
                show={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                loading={passwordConfirmLoading}
                title="Confirm Resource Deletion"
                description={`Are you sure you want to permanently delete '${itemToDelete?.title}'? This action cannot be undone.`}
            />

            {showAddModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
                        <div className={`${resourceType === 'pocket-guides' ? 'bg-amber-600' : 'bg-slate-900'} p-8 text-white relative shrink-0`}>
                            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <Plus size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">New {resourceType === 'pocket-guides' ? 'Pocket Guide' : 'Reference'}</h3>
                                    <p className="text-xs opacity-80 font-bold uppercase tracking-widest">Create Institutional Resource</p>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleAddSubmit} className="p-8 md:p-10 flex flex-col gap-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    label="Resource Title" 
                                    value={newRef.title} 
                                    onChange={e => setNewRef({...newRef, title: e.target.value})} 
                                    placeholder="e.g. Adult CAP Management"
                                    required 
                                />
                                <Select 
                                    label="Category" 
                                    options={resourceType === 'pocket-guides' ? POCKET_GUIDE_CATEGORIES : REFERENCE_CATEGORIES} 
                                    value={newRef.category} 
                                    onChange={e => setNewRef({...newRef, category: e.target.value})} 
                                    required 
                                />
                            </div>

                            {newRef.category === 'Others (Specify)' && (
                                <Input 
                                    label="Specify Category" 
                                    value={newRef.categoryOther} 
                                    onChange={e => setNewRef({...newRef, categoryOther: e.target.value})} 
                                    placeholder="e.g. Specialized Protocols"
                                    required
                                />
                            )}

                            <Input 
                                label="Brief Description" 
                                value={newRef.description} 
                                onChange={e => setNewRef({...newRef, description: e.target.value})} 
                                placeholder="Summary of the resource content"
                                required 
                            />

                            {resourceType === 'pocket-guides' ? (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-gray-600 uppercase tracking-tight ml-0.5">Guide Contents (Structured Text)</label>
                                    <textarea 
                                        className="px-4 py-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-white font-mono h-64"
                                        value={newRef.content}
                                        onChange={e => setNewRef({...newRef, content: e.target.value})}
                                        placeholder="### 1. SECTION NAME&#10;* Content Item 1&#10;* Content Item 2"
                                        required
                                    />
                                </div>
                            ) : (
                                <Input 
                                    label="External Link / URL" 
                                    type="url"
                                    value={newRef.link} 
                                    onChange={e => setNewRef({...newRef, link: e.target.value})} 
                                    placeholder="https://..."
                                    required 
                                />
                            )}

                            <div className="flex gap-4 mt-2 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddModal(false)} 
                                    className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`flex-1 py-4 ${resourceType === 'pocket-guides' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-slate-900 hover:bg-black shadow-slate-900/20'} text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2`}
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Resource</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editingItemData && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
                        <div className={`${resourceType === 'pocket-guides' ? 'bg-amber-600' : 'bg-slate-900'} p-8 text-white relative shrink-0`}>
                            <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <Edit3 size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Edit Resource</h3>
                                    <p className="text-xs opacity-80 font-bold uppercase tracking-widest">Update Institutional File</p>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className="p-8 md:p-10 flex flex-col gap-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    label="Resource Title" 
                                    value={editingItemData.title} 
                                    onChange={e => setEditingItemData({...editingItemData, title: e.target.value})} 
                                    required 
                                />
                                <Select 
                                    label="Category" 
                                    options={resourceType === 'pocket-guides' ? POCKET_GUIDE_CATEGORIES : REFERENCE_CATEGORIES} 
                                    value={editingItemData.category} 
                                    onChange={e => setEditingItemData({...editingItemData, category: e.target.value})} 
                                    required 
                                />
                            </div>

                            <Input 
                                label="Brief Description" 
                                value={editingItemData.description} 
                                onChange={e => setEditingItemData({...editingItemData, description: e.target.value})} 
                                required 
                            />

                            {resourceType === 'pocket-guides' ? (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-gray-600 uppercase tracking-tight ml-0.5">Guide Contents</label>
                                    <textarea 
                                        className="px-4 py-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-white font-mono h-64"
                                        value={editingItemData.content}
                                        onChange={e => setEditingItemData({...editingItemData, content: e.target.value})}
                                        required
                                    />
                                </div>
                            ) : (
                                <Input 
                                    label="External Link / URL" 
                                    type="url"
                                    value={editingItemData.link} 
                                    onChange={e => setEditingItemData({...editingItemData, link: e.target.value})} 
                                    required 
                                />
                            )}

                            <div className="flex gap-4 mt-2 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => setShowEditModal(false)} 
                                    className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`flex-1 py-4 ${resourceType === 'pocket-guides' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-slate-900 hover:bg-black shadow-slate-900/20'} text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2`}
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Update Resource</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    return isNested ? ListView : <Layout title={title || "Resources"}>{ListView}</Layout>;
};

export default Resources;