import { useState } from 'react';
import { Download, ChevronLeft, Award, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function InterviewResult({ candidate, resultData, onBack }) {
    const [includeQ7, setIncludeQ7] = useState(true);

    if (!resultData || !resultData.ai_analysis) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                <p>AI 분석 결과가 없습니다.</p>
                <button onClick={onBack} className="mt-4 text-blue-500 hover:underline">돌아가기</button>
            </div>
        );
    }

    const { overallScore, recommendation, summary, strengths = [], improvements = [], answerAnalysis = [] } = resultData.ai_analysis;

    const handleExportExcel = () => {
        // 필터링 적용 (Q7 포함 여부)
        const exportAnswers = includeQ7 ? answerAnalysis : answerAnalysis.filter((_, i) => i !== 6);

        // 기본 정보 시트
        const infoData = [
            ['항목', '내용'],
            ['지원자 이름', candidate.name],
            ['이메일', candidate.email],
            ['지원 직무', candidate.job_title],
            ['구분', candidate.department || '—'],
            ['AI 종합 점수', overallScore],
            ['추천 결과', recommendation],
            ['종합 평가', summary],
            ['강점', strengths.join('\n')],
            ['개선점', improvements.join('\n')]
        ];

        // 답변 분석 시트
        const qnaData = [
            ['문항 번호', '질문 내용', '지원자 답변', 'AI 평가 (피드백)', '부분 점수']
        ];

        exportAnswers.forEach((a, index) => {
            qnaData.push([
                `Q${index + 1}`,
                a.question,
                a.answer,
                a.feedback,
                a.score
            ]);
        });

        const wb = XLSX.utils.book_new();
        const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
        const wsQnA = XLSX.utils.aoa_to_sheet(qnaData);

        // 컬럼 너비 설정
        wsInfo['!cols'] = [{ wch: 15 }, { wch: 80 }];
        wsQnA['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 50 }, { wch: 50 }, { wch: 10 }];

        XLSX.utils.book_append_sheet(wb, wsInfo, "면접 종합 결과");
        XLSX.utils.book_append_sheet(wb, wsQnA, "질문별 상세 분석");

        XLSX.writeFile(wb, `${candidate.name}_AI면접결과.xlsx`);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{candidate.name} 면접 결과</h2>
                        <p className="text-sm text-slate-500 mt-1">{candidate.department || '미분류'} · {candidate.job_title}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                        <input type="checkbox" checked={includeQ7} onChange={e => setIncludeQ7(e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500/20" />
                        <span className="font-medium">희망 연봉(Q7) 포함</span>
                    </label>
                    <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-sm">
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel 다운로드
                    </button>
                </div>
            </div>

            {/* Summary Board */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-start gap-8">
                    {/* Score Circle */}
                    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 min-w-[200px]">
                        <Award className="w-10 h-10 text-emerald-500 mb-2" />
                        <p className="text-sm font-semibold text-emerald-700 mb-1">AI 종합 점수</p>
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                            {overallScore}
                        </div>
                        <div className="mt-4 px-4 py-1.5 bg-white rounded-full shadow-sm text-emerald-700 font-bold text-sm border border-emerald-100">
                            {recommendation}
                        </div>
                    </div>

                    {/* Summary Text */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-blue-500" /> 종합 평가
                            </h4>
                            <p className="text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                {summary}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                                <p className="font-bold text-blue-800 mb-3">주요 강점</p>
                                <ul className="space-y-2">
                                    {strengths.map((s, i) => (
                                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                                            <span className="text-blue-400 mt-0.5">•</span> <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
                                <p className="font-bold text-amber-800 mb-3">개선 및 참고사항</p>
                                <ul className="space-y-2">
                                    {improvements.map((s, i) => (
                                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                                            <span className="text-amber-400 mt-0.5">•</span> <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QnA List */}
            <div className="space-y-4 pt-4">
                <h3 className="text-xl font-bold text-slate-800 px-2">질문별 상세 분석</h3>
                <div className="grid gap-4">
                    {answerAnalysis.map((a, i) => {
                        // Q7 숨김 처리
                        if (!includeQ7 && i === 6) return null;

                        return (
                            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-start justify-between gap-4">
                                    <div>
                                        <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg mb-2 shadow-sm">
                                            Question {i + 1}
                                        </span>
                                        <p className="font-semibold text-slate-800 text-lg">{a.question}</p>
                                    </div>
                                    <div className="bg-white px-4 py-2 border border-emerald-100 rounded-xl shadow-sm text-center min-w-[80px]">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Score</p>
                                        <p className="text-xl font-black text-emerald-600 leading-none">{a.score}</p>
                                    </div>
                                </div>
                                <div className="p-5 grid grid-cols-2 gap-5">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">지원자 답변</p>
                                        <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
                                            {a.answer || '답변 없음'}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">AI 피드백</p>
                                        <div className="bg-emerald-50/50 p-4 rounded-xl text-emerald-800 text-sm leading-relaxed whitespace-pre-wrap border border-emerald-100">
                                            {a.feedback}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
