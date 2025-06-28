
import * as jsx from "@miqro/jsx";
import JSX from "@miqro/jsx";

let queryTimeout2: any = null;

export function useFilterQuery(): [string, (newFilter: string, inmediate?: boolean) => void] {
    const [filterQuery, setfilterQuery] = jsx.useQuery("filter", "");
    const [filter, setfilter] = jsx.useState<string>(typeof filterQuery === "string" ? filterQuery : "");

    return [
        filter,
        (newFilter: string, inmediate?: boolean) => {
            clearTimeout(queryTimeout2);
            if (inmediate) {
                setfilter(newFilter);
                setfilterQuery(newFilter);
            } else {
                setfilter(newFilter);
                queryTimeout2 = setTimeout(() => {
                    setfilter(newFilter);
                    setfilterQuery(newFilter);
                }, 1000);
            }
        }]
}
