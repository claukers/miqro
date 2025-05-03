let scrollTimeout2: any = null;

export function useScroll(): [{ scrollTop: string; scrollLeft: string }, (newScroll: { scrollTop: number; scrollLeft: number; }, inmediate?: boolean) => void] {
    const [scrollTop, setscrollTop] = jsx.useQuery("scrollTop", "0");
    const [scrollLeft, setscrollLeft] = jsx.useQuery("scrollLeft", "0");

    return [{
        scrollTop: scrollTop as string,
        scrollLeft: scrollLeft as string
    }, (newScroll: { scrollTop: number; scrollLeft: number; }, inmediate?: boolean) => {
        clearTimeout(scrollTimeout2);
        if (inmediate) {
            setscrollTop(String(newScroll.scrollTop));
            setscrollLeft(String(newScroll.scrollLeft));
        } else {
            scrollTimeout2 = setTimeout(() => {
                setscrollTop(String(newScroll.scrollTop));
                setscrollLeft(String(newScroll.scrollLeft));
            }, 1000);
        }
    }]
}
