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
    const achievedRewards = sortedRewards.filter(r => cartTotal >= r.threshold);
    const nextReward = sortedRewards.find(r => cartTotal < r.threshold);
    const isAllUnlocked = achievedRewards.length === sortedRewards.length;

    const progress = Math.min(100, (cartTotal / maxThreshold) * 100);

    return (
        <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 italic uppercase tracking-tighter">
                    <i className="fas fa-gift text-orange-500 animate-bounce"></i>
                    {isAllUnlocked ? (
                        <span className="text-emerald-600">🎉 Sab Rewards Unlocked!</span>
                    ) : (
                        nextReward && (
                            <span>
                                Add <span className="text-orange-600 font-extrabold">₹{(nextReward.threshold - cartTotal).toFixed(0)}</span> for <span className="text-orange-600 underline decoration-2 underline-offset-4">{nextReward.label}</span>
                            </span>
                        )
                    )}
                </h4>
                {isAllUnlocked && (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full animate-pulse">
                        MAX SAVINGS UNLOCKED
                    </span>
                )}
            </div>

            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                {/* Progress Fill */}
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500 transition-all duration-700 ease-out z-10"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-shimmer"></div>
                </div>

                {/* Reward Markers */}
                {sortedRewards.map((reward, index) => {
                    const markerPos = (reward.threshold / maxThreshold) * 100;
                    const isAchieved = cartTotal >= reward.threshold;

                    return (
                        <div
                            key={index}
                            className="absolute top-0 bottom-0 flex flex-col items-center z-20"
                            style={{ left: `${markerPos}%`, transform: 'translateX(-50%)' }}
                        >
                            <div className={`w-1 h-full ${isAchieved ? 'bg-white/40' : 'bg-slate-300'}`}></div>
                            <div className={`absolute -top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-all duration-500 ${isAchieved ? 'bg-orange-500 scale-125' : 'bg-slate-400'}`}></div>
                        </div>
                    );
                })}
            </div>

            {/* Achieving labels below */}
            <div className="flex justify-between mt-2 px-1">
                {sortedRewards.map((reward, index) => {
                    const isAchieved = cartTotal >= reward.threshold;
                    return (
                        <div key={index} className="flex flex-col items-center max-w-[60px]">
                            <span className={`text-[8px] font-black text-center leading-tight uppercase transition-all duration-300 ${isAchieved ? 'text-orange-600 scale-105' : 'text-slate-400'}`}>
                                {reward.label}
                            </span>
                            <span className={`text-[9px] font-bold ${isAchieved ? 'text-orange-500' : 'text-slate-400'}`}>₹{reward.threshold}</span>
                        </div>
                    );
                })}
            </div>

            {/* Sparkle background elements */}
            <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-orange-100 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        </div>
    );
};

export default RewardProgressBar;
