import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function CustomerForm({ initialData, onSubmit, onCancel }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        medical_info: {
            ipd: '',
            od: { sph: '', cyl: '', axis: '', add: '', pd: '' },
            os: { sph: '', cyl: '', axis: '', add: '', pd: '' }
        }
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                medical_info: initialData.medical_info || {
                    ipd: '',
                    od: { sph: '', cyl: '', axis: '', add: '', pd: '' },
                    os: { sph: '', cyl: '', axis: '', add: '', pd: '' }
                }
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMedicalChange = (eye, field, value) => {
        setFormData(prev => ({
            ...prev,
            medical_info: {
                ...prev.medical_info,
                [eye]: {
                    ...prev.medical_info[eye],
                    [field]: value
                }
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-10">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4 space-y-10 pb-10">
                {/* Personal Details */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] pl-4">{t.customers.personalDetails}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.common.name}</label>
                            <input
                                name="name"
                                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-800"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.common.phone}</label>
                            <input
                                name="phone"
                                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-800"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+20 1..."
                            />
                        </div>
                    </div>
                </div>

                {/* Medical Info Header */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">{t.customers.medicalInfo}</h3>
                        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IPD:</label>
                            <input
                                type="text"
                                className="bg-transparent border-none p-0 text-sm font-black text-indigo-400 w-12 focus:outline-none"
                                placeholder="mm"
                                value={formData.medical_info.ipd || ''}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    medical_info: { ...prev.medical_info, ipd: e.target.value }
                                }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Right Eye */}
                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -mr-16 -mt-16"></div>
                            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] relative z-10">{t.customers.rightEye} (OD)</h4>
                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                {['sph', 'cyl', 'axis', 'add', 'pd'].map(field => (
                                    <div key={field} className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-2">{t.customers[field] || field}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-black text-white focus:border-indigo-500/50 outline-none transition-all"
                                            value={formData.medical_info.od[field]}
                                            onChange={e => handleMedicalChange('od', field, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Left Eye */}
                        <div className="bg-purple-500/5 border border-purple-500/10 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] -mr-16 -mt-16"></div>
                            <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-[0.3em] relative z-10">{t.customers.leftEye} (OS)</h4>
                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                {['sph', 'cyl', 'axis', 'add', 'pd'].map(field => (
                                    <div key={field} className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-2">{t.customers[field] || field}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-black text-white focus:border-purple-500/50 outline-none transition-all"
                                            value={formData.medical_info.os[field]}
                                            onChange={e => handleMedicalChange('os', field, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-8 pt-8 border-t border-white/5 flex-shrink-0">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-4 text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                    {t.common.cancel}
                </button>
                <button
                    type="submit"
                    className="px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 uppercase tracking-[0.2em]"
                >
                    {t.customers.saveCustomer}
                </button>
            </div>
        </form>
    );
}
