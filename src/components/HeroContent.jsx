import React from 'react';
import { ChevronDown } from 'lucide-react';

const HeroContent = () => {
    return (
        <div className="absolute bg-black/5 inset-0 flex items-center justify-between px-5 sm:px-10 lg:px-20 text-white">
            {/* Left Section */}
            <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[66px] leading-tight pt-10 sm:pt-16 pb-8 sm:pb-16 tracking-tight font-bold">
                    We are<br />movement
                </h1>

                <div className="space-y-3 sm:space-y-4 hidden sm:block">
                    <h2 className="text-sm sm:text-base lg:text-lg leading-5">
                        Your<br />
                        freedom to<br />
                        enjoy life
                    </h2>

                    <p>——</p>

                    <p className="text-xs font-semibold leading-4 text-white max-w-[300px]">
                        Every flight is designed around your comfort, time, and ambitions — so you can focus on what truly matters, while we take care of everything else.
                    </p>
                </div>
            </div>

            {/* Middle Section */}
            <div className="flex-1 flex items-center justify-center text-3xl cursor-pointer">
                <p></p>
            </div>

            {/* Right Section */}
            <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md flex flex-col items-end">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[60px] font-bold leading-tight text-right pt-16 sm:pt-36 md:pt-52 pb-8 sm:pb-20">
                    We are<br />distinction
                </h1>

                <div className="flex flex-col items-end gap-4 sm:gap-6 mt-auto">
                    <div className="w-full h-px bg-white" />
                    <div className="flex items-center gap-8 sm:gap-20 justify-between">
                        <button className="flex items-center gap-2 text-[9px] tracking-tight group">
                            <div className="flex flex-col">
                                <ChevronDown size={16}/>
                                <ChevronDown size={16} className="-mt-[11px]"/>
                                <ChevronDown size={16} className="-mt-[11px]"/>
                            </div>
                            <span className="hidden sm:inline">SCROLL DOWN</span>
                        </button>
                        <button className="text-[9px] tracking-tight hover:opacity-80 transition-opacity hidden sm:block">
                            TO START THE JOURNEY
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroContent;