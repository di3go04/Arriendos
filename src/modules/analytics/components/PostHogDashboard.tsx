"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const pageViews = [
    { dia: "Lun", visitas: 1240 },
    { dia: "Mar", visitas: 980 },
    { dia: "Mié", visitas: 1560 },
    { dia: "Jue", visitas: 1820 },
    { dia: "Vie", visitas: 1100 },
    { dia: "Sáb", visitas: 720 },
    { dia: "Dom", visitas: 890 },
];

const conversion = [
    { mes: "Ene", tasa: 2.4 },
    { mes: "Feb", tasa: 3.1 },
    { mes: "Mar", tasa: 2.8 },
    { mes: "Abr", tasa: 4.2 },
    { mes: "May", tasa: 3.9 },
    { mes: "Jun", tasa: 5.1 },
];

export const PostHogDashboard = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Panel de Analítica</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard label="Eventos de página" value="8,350" sub="últimos 7 días" />
                <SummaryCard label="Tasa de conversión" value="3.6%" sub="promedio mensual" />
                <SummaryCard label="Usuarios activos" value="1,247" sub="este mes" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Visitas por día</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={pageViews}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: 8,
                                    border: "1px solid #e5e7eb",
                                    fontSize: 13,
                                }}
                            />
                            <Bar dataKey="visitas" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Tasa de conversión (%)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={conversion}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} domain={[0, 6]} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: 8,
                                    border: "1px solid #e5e7eb",
                                    fontSize: 13,
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="tasa"
                                stroke="#059669"
                                strokeWidth={2}
                                dot={{ fill: "#059669", r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
                <p className="text-gray-700 text-sm mb-3">
                    ¿Quieres ver el dashboard completo con todas las métricas desglosadas?
                </p>
                <a
                    href="https://app.posthog.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                    Abrir PostHog Dashboard
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        </div>
    );
};

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
        </div>
    );
}
