// src/utils/layoutRegistry.js
import FnbWebLayout from "../layouts/fnb/FnbWebLayout";
import FnbPosLayout from "../layouts/fnb/FnbPosLayout.jsx";
import RetailWebLayout from "../layouts/retail/RetailWebLayout";
import RetailPosLayout from "../layouts/retail/RetailPosLayout";

import { fnbWebNav, fnbPosNav } from "../layouts/fnb/navItems";
import { retailWebNav } from "../layouts/retail/navItems";

export const layoutRegistry = {
    FNB: {
        web: {
            OWNER: { layout: FnbWebLayout, props: { title: "FNB Admin", navItems: fnbWebNav.admin } },
            MANAGER: { layout: FnbWebLayout, props: { title: "FNB Manager", navItems: fnbWebNav.admin } },
            ADMIN: { layout: FnbWebLayout, props: { title: "FNB Admin", navItems: fnbWebNav.admin } },
            STAFF: { layout: FnbWebLayout, props: { title: "FNB Staff", navItems: fnbWebNav.staff } },
        },
        pos: {
            OWNER: { layout: FnbPosLayout, props: { title: "FNB POS Admin" } },
            MANAGER: { layout: FnbPosLayout, props: { title: "FNB POS Manager" } },
            ADMIN: { layout: FnbPosLayout, props: { title: "FNB POS Admin" } },
            STAFF: { layout: FnbPosLayout, props: { title: "FNB POS Staff", navItems: fnbPosNav.staff } },
        },
    },

    RETAIL: {
        web: {
            OWNER: { layout: RetailWebLayout, props: { title: "Retail Manager", navItems: retailWebNav.manager } },
            MANAGER: { layout: RetailWebLayout, props: { title: "Retail Manager", navItems: retailWebNav.manager } },
            ADMIN: { layout: RetailWebLayout, props: { title: "Retail Admin", navItems: retailWebNav.manager } },
            STAFF: { layout: RetailWebLayout, props: { title: "Retail Staff", navItems: retailWebNav.staff } },
        },
        pos: {
            OWNER: { layout: RetailPosLayout, props: { title: "Retail POS Manager" } },
            MANAGER: { layout: RetailPosLayout, props: { title: "Retail POS Manager" } },
            ADMIN: { layout: RetailPosLayout, props: { title: "Retail POS Admin" } },
            STAFF: { layout: RetailPosLayout, props: { title: "Retail POS Staff" } },
        },
    }
};
