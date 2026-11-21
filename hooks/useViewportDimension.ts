"use client";

import { useLayoutEffect, useState } from "react";

const useViewportDimension = () => {
    const [viewportHeight, setViewportHeight] = useState<number>(() =>
        typeof window === "undefined" ? 0 : window.scrollY,
    );

    useLayoutEffect(() => {
        const handleScroll = () => {
            setViewportHeight(window.scrollY);
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return {
        viewportHeight,
    };
};

export default useViewportDimension;
