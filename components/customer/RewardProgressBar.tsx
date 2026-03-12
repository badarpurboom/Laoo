import React from 'react';
import { RewardLevel } from '../../types';

interface RewardProgressBarProps {
    cartTotal: number;
    rewardConfig: RewardLevel[];
}

const RewardProgressBar: React.FC<RewardProgressBarProps> = ({ cartTotal, rewardConfig }) => {
    if (!rewardConfig || rewardConfig.length === 0) return null;

    // Sort rewards by threshold to ensure correct progression
    const sortedRewards = [...rewardConfig].sort((a, b) => a.threshold - b.threshold);
    const maxThreshold = sortedRewards[sortedRewards.length - 1].threshold;

    // Find current and next reward
    const nextReward = sortedRewards.find(r => cartTotal < r.threshold);
    const isAllUnlocked = !nextReward;

    const progress = Math.min(100, (cartTotal / maxThreshold) * 100);

    return (
        <div className="bg-[#FFFBF5] px-5 py-3 rounded-t-[2rem] border-x border-t border-orange-100/50 shadow-[0_-8px_20px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-center min-h-[65px]">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-slate-700 tracking-tight">
                    {isAllUnlocked ? (
                        <span className="text-emerald-600 font-extrabold flex items-center gap-1.5 animate-pulse">
                             Sab Rewards Unlocked! 🎉
                        </span>
                    ) : (
                        nextReward && (
                            <span className="text-slate-600">
                                ₹<span className="text-slate-900 font-black">{(nextReward.threshold - cartTotal).toFixed(0)}</span> aur add karo → <span className="text-orange-600 font-extrabold">{nextReward.label}</span> unlock
                            </span>
                        )
                    )}
                </span>
            </div>

            <div className="relative h-2 bg-slate-200/40 rounded-full overflow-hidden">
                {/* Progress Fill */}
                <div
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000 ease-out z-10 ${isAllUnlocked ? 'shadow-[0_0_12px_rgba(249,115,22,0.4)] animate-pulse' : ''}`}
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:15px_15px] animate-shimmer"></div>
                </div>

                {/* Subtle Milestone Markers */}
                {sortedRewards.map((reward, index) => {
                    const markerPos = (reward.threshold / maxThreshold) * 100;
                    const isAchieved = cartTotal >= reward.threshold;

                    return (
                        <div
                            key={index}
                            className="absolute top-1/2 -translate-y-1/2 z-20"
                            style={{ left: `${markerPos}%` }}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all duration-500 ${isAchieved ? 'bg-white scale-110 border border-orange-500/20' : 'bg-slate-300'}`}></div>
                        </div>
                    );
                })}
            </div>

            {/* Micro Glow for unlock */}
            {isAllUnlocked && (
                <div className="absolute inset-0 bg-orange-400/5 pointer-events-none animate-pulse"></div>
            )}
        </div>
    );
};

export default RewardProgressBar;
