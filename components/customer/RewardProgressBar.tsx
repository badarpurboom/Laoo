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

    // Find next reward
    const nextReward = sortedRewards.find(r => cartTotal < r.threshold);
    const isAllUnlocked = !nextReward;

    const progress = Math.min(100, (cartTotal / maxThreshold) * 100);

    return (
        <div className="bg-[#FFF7ED] px-5 py-3 rounded-t-[14px] border-x border-t border-[#FFE0C2] shadow-[0_-6px_16px_rgba(0,0,0,0.08)] relative overflow-hidden flex flex-col justify-center min-h-[65px]">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[12px] font-bold text-slate-700 tracking-tight">
                    {isAllUnlocked ? (
                        <span className="text-emerald-600 font-extrabold flex items-center gap-1.5 animate-pulse">
                             Sab Rewards Unlocked! 🎉
                        </span>
                    ) : (
                        nextReward && (
                            <span className="text-slate-600">
                                Bas ₹<span className="text-slate-900 font-black">{(nextReward.threshold - cartTotal).toFixed(0)}</span> aur → <span className="text-[#FF6A00] font-extrabold">{nextReward.label}</span>
                            </span>
                        )
                    )}
                </span>
            </div>

            <div className="relative h-2 bg-slate-200/50 rounded-full overflow-hidden">
                {/* Progress Fill */}
                <div
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-[#FF6A00] transition-[width] duration-600 ease-in-out z-10 ${isAllUnlocked ? 'shadow-[0_0_12px_rgba(255,106,0,0.4)]' : ''}`}
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:15px_15px] animate-shimmer"></div>
                </div>

                {/* Milestone Markers */}
                {sortedRewards.map((reward, index) => {
                    const markerPos = (reward.threshold / maxThreshold) * 100;
                    const isAchieved = cartTotal >= reward.threshold;

                    return (
                        <div
                            key={index}
                            className="absolute top-1/2 -translate-y-1/2 z-20"
                            style={{ left: `${markerPos}%` }}
                        >
                            <div 
                                className={`rounded-full transition-all duration-500 shadow-sm ${
                                    isAchieved 
                                    ? 'bg-[#FF6A00] scale-[1.3] w-[8px] h-[8px] border border-white/40' 
                                    : 'bg-[#D1D5DB] w-[8px] h-[8px]'
                                }`}
                            ></div>
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
