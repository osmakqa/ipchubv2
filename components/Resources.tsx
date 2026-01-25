import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Layout from './ui/Layout';
import Input from './ui/Input';
import Select from './ui/Select';
import { useAuth } from '../AuthContext';
import { 
    ChevronLeft, 
    FileText, 
    Download, 
    Search, 
    BookOpen, 
    ShieldCheck, 
    Clock, 
    ChevronRight,
    ExternalLink,
    FileCheck,
    ScrollText,
    BadgeInfo,
    Library,
    ArrowLeft,
    Plus,
    X,
    Loader2,
    Save,
    Edit3,
    Link as LinkIcon
} from 'lucide-react';
import { HAND_HYGIENE_MD, ISOLATION_PRECAUTIONS_MD } from '../constants/guidelines';
import { getReferences, submitReference, updateReference } from '../services/ipcService';

interface Resource {
    id: string;
    title: string;
    category: string;
    updated: string;
    description: string;
    type: 'pdf' | 'link' | 'text';
    content?: string;
    link?: string;
}

const STATIC_POLICIES: Resource[] = [
    { id: 'policy_1', title: 'Hand Hygiene Practices', category: 'General Precautions', updated: 'May 2023', description: 'Institutional guidelines for timely and effectively hand hygiene to protect patients and staff.', type: 'text', content: HAND_HYGIENE_MD },
    { id: 'policy_2', title: 'Isolation Precautions', category: 'Isolation & Transmission', updated: 'May 2023', description: 'Standardized implementation of isolation precautions (Contact, Droplet, Airborne) to prevent transmission.', type: 'text', content: ISOLATION_PRECAUTIONS_MD }
];

const REFERENCE_CATEGORIES = [
    "Healthcare-Associated Infections",
    "Notifiable Diseases",
    "Pulmonary Tuberculosis",
    "Infection Prevention and Control",
    "Others (Specify)"
];

interface Props {
    title?: string;
    type?: 'policies' | 'pathways';
    isNested?: boolean;
}

const Resources: React.FC<Props> = ({ title, type, isNested }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [search, setSearch] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<Resource | null>(null);
    const [dbItems, setDbItems] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Form state for adding new reference
    const [newRef, setNewRef] = useState({
        title: '',
        link: '',
        description: '',
        category: '',
        categoryOther: ''
    });

    // Form state for editing existing reference
    const [editingItemData, setEditingItemData] = useState<any>(null);

    const resourceType = type || 'policies';

    useEffect(() => {
        loadData();
    }, [resourceType]);

    const loadData = async () => {
        if (resourceType === 'pathways') {
            setLoading(true);
            try {
                const refs = await getReferences();
                const mappedRefs: Resource[] = refs.map((r: any) => ({
                    id: r.id,
                    title: r.title,
                    category: r.category,
                    updated: r.created_at?.toDate ? r.created_at.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently',
                    description: r.description,
                    type: 'link',
                    link: r.link
                }));
                setDbItems(mappedRefs);
            } catch (e) {
                console.error("Error loading references:", e);
            } finally {
                setLoading(false);
            }
        }
    };

    const items = useMemo(() => {
        if (resourceType === 'policies') return STATIC_POLICIES;
        return dbItems;
    }, [resourceType, dbItems]);
    
    const filteredItems = items.filter(i => 
        i.title.toLowerCase().includes(search.toLowerCase()) || 
        i.category.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase())
    );

    const handleRead = (item: Resource) => {
        if (item.type === 'text' && item.content) {
            setSelectedDoc(item);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (item.type === 'link' && item.link) {
            window.open(item.link, '_blank');
        } else {
            alert('Downloading documentation...');
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const category = newRef.category === 'Others (Specify)' ? newRef.categoryOther : newRef.category;
        
        const success = await submitReference({
            title: newRef.title,
            link: newRef.link,
            description: newRef.description,
            category
        });

        if (success) {
            setShowAddModal(false);
            setNewRef({ title: '', link: '', description: '', category: '', categoryOther: '' });
            loadData();
        } else {
            alert("Failed to save reference.");
        }
        setLoading(false);
    };

    const handleEditClick = (item: Resource) => {
        const isStandardCategory = REFERENCE_CATEGORIES.includes(item.category);
        setEditingItemData({
            id: item.id,
            title: item.title,
            link: item.link || '',
            description: item.description,
            category: isStandardCategory ? item.category : 'Others (Specify)',
            categoryOther: isStandardCategory ? '' : item.category
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const category = editingItemData.category === 'Others (Specify)' ? editingItemData.categoryOther : editingItemData.category;
        
        const success = await updateReference({
            id: editingItemData.id,
            title: editingItemData.title,
            link: editingItemData.link,
            description: editingItemData.description,
            category
        });

        if (success) {
            setShowEditModal(false);
            setEditingItemData(null);
            loadData();
        } else {
            alert("Failed to update reference.");
        }
        setLoading(false);
    };

    if (selectedDoc) {
        return (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20">
                <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-10 border-b border-slate-200 -mx-4 px-4">
                    <button 
                        onClick={() => setSelectedDoc(null)}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={16} /> Library
                    </button>
                </div>

                <header className="flex flex-col gap-3 pt-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedDoc.category}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated: {selectedDoc.updated}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight">{selectedDoc.title}</h1>
                    <div className="h-1.5 w-20 bg-primary rounded-full mt-2"></div>
                </header>

                <article className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 markdown-content">
                    <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-h2:border-b prose-h2:mt-10 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
                        <ReactMarkdown
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-xl font-black text-slate-900 mt-10 mb-4 pb-2 border-b-2 border-slate-50 uppercase tracking-wide" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-sm font-black text-primary mt-6 mb-3 uppercase tracking-widest" {...props} />,
                                h4: ({node, ...props}) => <h4 className="text-xs font-black text-slate-500 mt-4 mb-2 uppercase tracking-[0.1em]" {...props} />,
                                p: ({node, ...props}) => <p className="text-base text-slate-600 leading-relaxed mb-4 font-medium" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-none space-y-2 mb-6" {...props} />,
                                li: ({node, ...props}) => (
                                    <li className="flex items-start gap-3 text-slate-600 font-medium">
                                        <div className="size-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                                        <span>{props.children}</span>
                                    </li>
                                ),
                                strong: ({node, ...props}) => <strong className="font-black text-slate-900" {...props} />,
                            }}
                        >
                            {selectedDoc.content || ''}
                        </ReactMarkdown>
                    </div>
                </article>

                <footer className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col items-center text-center gap-4">
                    <Library size={32} className="text-emerald-400" />
                    <div className="flex flex-col gap-1">
                        <h4 className="font-black uppercase tracking-tight">Official Guideline Document</h4>
                        <p className="text-xs text-slate-400 font-medium max-w-sm">This document is managed by the Ospital ng Makati IPC Committee. Unauthorized modifications are prohibited.</p>
                    </div>
                    <button 
                        onClick={() => setSelectedDoc(null)}
                        className="mt-4 px-8 py-3 bg-white text-slate-900 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-400 hover:text-white transition-all"
                    >
                        Back to Resources
                    </button>
                </footer>
            </div>
        );
    }

    const ListView = (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {!isNested && (
                        <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-[var(--osmak-green)] font-bold">
                            <ChevronLeft size={16} /> Hub Dashboard
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <BadgeInfo size={16} className="text-primary" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            {filteredItems.length} documents found
                        </span>
                    </div>
                    {isAuthenticated && resourceType === 'pathways' && (
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="h-10 px-6 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2"
                        >
                            <Plus size={14}/> Add Reference
                        </button>
                    )}
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--osmak-green)] outline-none shadow-sm transition-all font-medium"
                        placeholder={`Search ${title || 'Resources'}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" size={48} /></div>
                ) : (
                    filteredItems.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => handleRead(item)}
                            className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary transition-all group flex flex-col gap-3 md:gap-4 relative overflow-hidden cursor-pointer"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <span className="text-[9px] md:text-[10px] font-black uppercase text-[var(--osmak-green)] tracking-widest">{item.category}</span>
                                    <h3 className="font-black text-base md:text-xl text-slate-900 mt-0.5 md:mt-1 group-hover:text-primary transition-colors leading-tight">{item.title}</h3>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-2 md:ml-4">
                                    {isAuthenticated && resourceType === 'pathways' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                            className="p-1.5 md:p-2 text-slate-300 hover:text-primary hover:bg-slate-50 rounded-lg md:rounded-xl transition-all"
                                            title="Edit Reference"
                                        >
                                            <Edit3 size={18} className="md:w-5 md:h-5" />
                                        </button>
                                    )}
                                    <div className="p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl group-hover:bg-green-50 text-gray-400 group-hover:text-primary transition-colors">
                                        {item.type === 'pdf' ? <ScrollText size={20} className="md:w-6 md:h-6" /> : item.type === 'link' ? <ExternalLink size={20} className="md:w-6 md:h-6" /> : <FileText size={20} className="md:w-6 md:h-6" />}
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed line-clamp-1 md:line-clamp-2">{item.description}</p>
                            
                            <div className="flex items-center justify-between mt-auto pt-3 md:pt-4 border-t border-slate-50">
                                <span className="text-[8px] md:text-[9px] font-black text-slate-300 flex items-center gap-1 uppercase tracking-widest">
                                    <Clock size={10}/> Updated {item.updated}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--osmak-green-dark)]">
                                    {item.type === 'pdf' ? (
                                        <><Download size={14} /> Download</>
                                    ) : item.type === 'link' ? (
                                        <><ExternalLink size={14} /> Access</>
                                    ) : (
                                        <><BookOpen size={14} /> Read</>
                                    )}
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                                </div>
                            </div>
                            <div className="absolute bottom-[-15px] right-[-15px] md:bottom-[-20px] md:right-[-20px] opacity-0 group-hover:opacity-5 transition-opacity">
                                <Library size={80} className="md:w-[120px] md:h-[120px] text-primary rotate-12" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {filteredItems.length === 0 && !loading && (
                <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4 animate-in fade-in">
                    <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-2">
                        <Search size={40}/>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="font-black text-slate-400 uppercase tracking-widest">No Documents Found</h3>
                        <p className="text-sm text-slate-300 font-bold">Try adjusting your search keywords</p>
                    </div>
                    <button 
                        onClick={() => setSearch('')}
                        className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-colors"
                    >
                        Clear Search Filter
                    </button>
                </div>
            )}

            {/* Add Reference Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-slate-900 p-8 text-white relative">
                            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500 rounded-2xl">
                                    <Plus size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Add Reference</h3>
                                    <p className="text-xs opacity-80 font-bold uppercase tracking-widest">New Clinical Resource</p>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleAddSubmit} className="p-10 flex flex-col gap-6">
                            <Input 
                                label="Resource Title" 
                                value={newRef.title} 
                                onChange={e => setNewRef({...newRef, title: e.target.value})} 
                                placeholder="e.g. WHO Hand Hygiene Guidelines 2024"
                                required 
                            />
                            
                            <Input 
                                label="Resource Link (URL)" 
                                type="url"
                                value={newRef.link} 
                                onChange={e => setNewRef({...newRef, link: e.target.value})} 
                                placeholder="https://..."
                                required 
                            />

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-gray-600 uppercase tracking-tight ml-0.5">Short Description</label>
                                <textarea 
                                    className="px-4 py-3 text-base rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-white placeholder:text-gray-300"
                                    value={newRef.description}
                                    onChange={e => setNewRef({...newRef, description: e.target.value})}
                                    placeholder="Briefly explain what this resource covers..."
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-4">
                                <Select 
                                    label="Category" 
                                    options={REFERENCE_CATEGORIES} 
                                    value={newRef.category} 
                                    onChange={e => setNewRef({...newRef, category: e.target.value})} 
                                    required 
                                />
                                {newRef.category === 'Others (Specify)' && (
                                    <Input 
                                        label="Specify Category" 
                                        value={newRef.categoryOther} 
                                        onChange={e => setNewRef({...newRef, categoryOther: e.target.value})} 
                                        placeholder="e.g. Antibiotic Stewardship"
                                        required
                                    />
                                )}
                            </div>

                            <div className="flex gap-4 mt-4">
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
                                    className="flex-1 py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-osmak-green-dark transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Resource</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Reference Modal */}
            {showEditModal && editingItemData && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-primary p-8 text-white relative">
                            <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <Edit3 size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Edit Reference</h3>
                                    <p className="text-xs opacity-80 font-bold uppercase tracking-widest">Update Clinical Resource</p>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className="p-10 flex flex-col gap-6">
                            <Input 
                                label="Resource Title" 
                                value={editingItemData.title} 
                                onChange={e => setEditingItemData({...editingItemData, title: e.target.value})} 
                                required 
                            />
                            
                            <Input 
                                label="Resource Link (URL)" 
                                type="url"
                                value={editingItemData.link} 
                                onChange={e => setEditingItemData({...editingItemData, link: e.target.value})} 
                                required 
                            />

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-gray-600 uppercase tracking-tight ml-0.5">Short Description</label>
                                <textarea 
                                    className="px-4 py-3 text-base rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-white placeholder:text-gray-300"
                                    value={editingItemData.description}
                                    onChange={e => setEditingItemData({...editingItemData, description: e.target.value})}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-4">
                                <Select 
                                    label="Category" 
                                    options={REFERENCE_CATEGORIES} 
                                    value={editingItemData.category} 
                                    onChange={e => setEditingItemData({...editingItemData, category: e.target.value})} 
                                    required 
                                />
                                {editingItemData.category === 'Others (Specify)' && (
                                    <Input 
                                        label="Specify Category" 
                                        value={editingItemData.categoryOther} 
                                        onChange={e => setEditingItemData({...editingItemData, categoryOther: e.target.value})} 
                                        required
                                    />
                                )}
                            </div>

                            <div className="flex gap-4 mt-4">
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
                                    className="flex-1 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
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