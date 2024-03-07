import { LinksPaginated, MetaPaginated } from "consumer-data-standards/banking";
import { ResponseErrorListV2 } from "consumer-data-standards/energy";
import { Request } from 'express';
import { Url } from "url";

export function paginateData(data: any[], query: any): any | ResponseErrorListV2{
    let pageSize = 25; //Default
    let page = 1;
    if (query["page-size"] != null)
        pageSize = parseInt(query["page-size"]);
    if (query["page"] != null)
        page = parseInt(query["page"]);
    let cnt: number = data?.length;
    let pages = Math.ceil(cnt / pageSize);
    if (pages > 0 && pages < page) {

        let error: ResponseErrorListV2 = {
            errors: [
                {
                    code: `urn:au-cds:error:cds-all:Field/InvalidPage`,
                    title: `Invalid Page`,
                    detail: `Maximum number of pages: ${pages}`
                }
            ]
        }
        return error;
    }
    let startIdx = Math.max(0, (page - 1) * pageSize);
    let endIdx = Math.min(startIdx + pageSize, cnt);
    if (startIdx >= cnt || startIdx > endIdx)
        return [];
    // check for invalid page request
    return data?.slice(startIdx, endIdx);
}

export function getLinksPaginated(req: Request, query: any, count: number): LinksPaginated {
    let pageSize = 25; //Default
    let page = 1;
    if (query["page-size"] != null)
        pageSize = parseInt(query["page-size"]);
    if (query["page"] != null)
        page = parseInt(query["page"]);
    let pages = Math.ceil(count / pageSize);
    let idx = req.originalUrl.indexOf("page=");
    let st = req.originalUrl.substring(idx);
    let idx2 = Math.max(st.indexOf("&"), 0);
    let st2 = st.substring(0,idx2);

    let nextPage = Math.min(page + 1, pages);
    let newPageSt = "page=" + nextPage;
    let next = req.originalUrl.replace(st2, newPageSt);

    let lastPageSt = "page=" + pages;
    let last = req.originalUrl.replace(st2, lastPageSt);

    let firstPageSt = "page=1";
    let first = req.originalUrl.replace(st2, firstPageSt);

    let prevPage = Math.max(page - 1, 1); 
    let prevPageSt = "page=" + prevPage;
    let prev = req.originalUrl.replace(st2, prevPageSt);

    let lp: LinksPaginated = {
        self: req.protocol + '://' + req.get('host') + req.originalUrl
    }
    // not the last page
    if (query["page"] != null && page < pages){
        lp.next = req.protocol + '://' + req.get('host') + next;
        lp.last = req.protocol + '://' + req.get('host') + last
    }
    // not the first page
    if (query["page"] != null && page > 1) {
        lp.prev = req.protocol + '://' + req.get('host') + prev;
        lp.first = req.protocol + '://' + req.get('host') + first
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

