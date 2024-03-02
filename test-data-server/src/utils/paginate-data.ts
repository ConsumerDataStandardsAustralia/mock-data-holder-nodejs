import { LinksPaginated, MetaPaginated } from "consumer-data-standards/banking";

export function paginateData(data: any[], query: any): any[] {
    let pageSize = 25; //Default
    let page = 1;
    if (query["page-size"] != null)
        pageSize = parseInt(query["page-size"]);
    if (query["page"] != null)
        page = parseInt(query["page"]);
    let cnt: number = data?.length;
    let startIdx = Math.max(0, (page - 1) * pageSize);
    let endIdx = Math.min(startIdx + pageSize, cnt);
    if (startIdx >= cnt || startIdx > endIdx)
        return [];
    // check for invalid page request
    return data?.slice(startIdx, endIdx);
}

export function getLinksPaginated(): LinksPaginated {
    let lp: LinksPaginated = {
        self: ""
    }
    return lp;
}

export function getMetaPaginated(query: any | undefined, count: number): MetaPaginated {
    let pageSize = 25;
    if (query["page-size"] != null)
        pageSize = Math.max(1, parseInt(query["page-size"] as string));
    let pages = Math.ceil(count / pageSize);
    let mp: MetaPaginated = {
        totalPages: pages,
        totalRecords: count
    }
    return mp;
}

