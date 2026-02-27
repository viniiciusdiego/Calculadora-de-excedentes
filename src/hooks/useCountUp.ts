import { useState, useEffect } from 'react';

export const useCountUp = (endValue: number, duration = 500) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = endValue;
        if (typeof end !== 'number' || isNaN(end)) {
            setCount(endValue || 0);
            return;
        }

        let startTime = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const easedPercentage = 1 - Math.pow(1 - percentage, 4); // Quartic ease-out
            const nextValue = easedPercentage * (end - start) + start;
            
            setCount(nextValue);

            if (percentage < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        const rafId = requestAnimationFrame(animate);
        
        return () => cancelAnimationFrame(rafId);
    }, [endValue, duration]);

    return count;
};
