import { useState, useEffect } from 'react';

export function usePullToRefresh(onRefresh) {
    const [pulling, setPulling] = useState(false);
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);

    useEffect(() => {
        const handleTouchStart = (e) => {
            if (window.scrollY === 0) {
                setStartY(e.touches[0].clientY);
            }
        };

        const handleTouchMove = (e) => {
            if (window.scrollY === 0 && startY) {
                const currentY = e.touches[0].clientY;
                const distance = currentY - startY;

                if (distance > 0) {
                    setPullDistance(Math.min(distance, 100));

                    if (distance > 80) {
                        setPulling(true);
                    }
                }
            }
        };

        const handleTouchEnd = async () => {
            if (pulling && pullDistance > 80) {
                await onRefresh();
            }

            setPulling(false);
            setPullDistance(0);
            setStartY(0);
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [startY, pulling, pullDistance, onRefresh]);

    return { pulling, pullDistance };
}