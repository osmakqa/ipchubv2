import React, { useState } from 'react';
import { 
  FileStack, 
  Search, 
  Download, 
  ExternalLink, 
  FileText,
  Filter,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

const CIF_DATA = [
  { name: "MPOX", link: "https://drive.google.com/open?id=1sbeg_NGbuMIottsjWYaIG488_PZIFi6X" },
  { name: "Acute Flaccid Paralysis", link: "https://drive.google.com/open?id=1-4iM5MlZHocEvCDAqYM8sa7BPtWE7FES" },
  { name: "Diphtheria", link: "https://drive.google.com/open?id=1Qol8n1qDM2H0G2ljUGexnIBu5P9d5Z38" },
  { name: "Meningococcal Disease", link: "https://drive.google.com/open?id=1v8-8HIhrH0XRCwgEnWb7ew7PQ9Q_A-3U" },
  { name: "Measles/Rubella", link: "https://drive.google.com/open?id=1J0ee49r2JEIFumaLMjWd-x0u7U02fHyH" },
  { name: "Neonatal Tetanus", link: "https://drive.google.com/open?id=1hhqJI2eue_cN-0avQ4T4Zaf2vhYl4azC" },
  { name: "Pertusis", link: "https://drive.google.com/open?id=1DF5J6zOAF0TJdIg2GRXYnR4MoPiX3fJg" },
  { name: "Rabies", link: "https://drive.google.com/open?id=1iPAlBqvFnYkn9GU8ibXgceoQLt4Wwl2x" },
  { name: "Rotavirus", link: "https://drive.google.com/open?id=1h349pO1rioMKBrQnvYWvO4kb-OWFKL8U" },
  { name: "SARI", link: "https://drive.google.com/open?id=1wL35BiE8_b3Nb0ukbErrhXNYLaR0BgQs" },
  { name: "Acute Bloody Diarrhea", link: "https://drive.google.com/open?id=1YHJb02Y33_5YhcswHD2nwJfiXGCfMAWb" },
  { name: "Acute Meningitis-Encephalitis Surveillance", link: "https://drive.google.com/open?id=1D4CCgX8R_7MwGRui-ubncDAYap0HBxem" },
  { name: "Chikugunya", link: "https://drive.google.com/open?id=1ojBP40dgEpkWo0f-8-LmeRNHvLldMF1j" },
  { name: "Dengue", link: "https://drive.google.com/open?id=1u0bI5NxPO5rTBe949T7HUeDNYSyFRAB8" },
  { name: "Hepatitis A", link: "https://drive.google.com/open?id=1lZVf8OCuAgBxXgNUrHRmZD01zYbEKC6J" },
  { name: "Influenza-like Illness", link: "https://drive.google.com/open?id=1clMlUmqpGTzGC7ptfYKpcEUsPjpg0FB9" },
  { name: "Leptospirosis", link: "https://drive.google.com/open?id=1CBHtTLlCuzcnacWYuA3NDzK5UOsW2eX7" },
  { name: "Non-neonatal Tetanus", link: "https://drive.google.com/open?id=1AVrYDOFOhxs0gwSuKS1sE4ujIwPzWZ5w" },
  { name: "Typhoid", link: "https://drive.google.com/open?id=1hdPPr0U3v-JBsKtjasdYhPZLTsHTflvm" },
  { name: "Cholera", link: "https://drive.google.com/open?id=19it0HuB-YSMvA11wuGgNsjhfSEgdB86x" },
];

const CIFForms: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredForms = CIF_DATA.filter(form => 
    form.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">CIF / CRF Repository</h2>
          <p className="text-sm font-medium text-slate-500">Mandatory Case Investigation and Report Forms for Surveillance.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search forms..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all font-medium text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredForms.length === 0 ? (
          <div className="col-span-full p-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No forms matching your search</p>
          </div>
        ) : (
          filteredForms.map((form, idx) => (
            <a 
              key={idx} 
              href={form.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all group flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Official Form</span>
                  <h3 className="font-black text-sm text-slate-800 uppercase leading-tight truncate">{form.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                 <div className="size-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                   <Download size={16} />
                 </div>
                 <ArrowRight size={14} className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </a>
          ))
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 flex items-start gap-4 shadow-sm">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
          <FileStack size={24} />
        </div>
        <div>
          <h4 className="text-xs font-black text-blue-900 uppercase tracking-tight">Institutional Compliance</h4>
          <p className="text-[10px] font-bold text-blue-700/70 mt-1 leading-relaxed">
            Ensure all Case Investigation Forms are completed within 24 hours of patient registration. These links point to the official OsMak Google Drive repository.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CIFForms;