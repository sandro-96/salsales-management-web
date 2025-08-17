// Import layouts and navItems
import FnbWebLayout from "../layouts/fnb/FnbWebLayout";
import FnbPosLayout from "../layouts/fnb/FnbPosLayout";
import RetailWebLayout from "../layouts/retail/RetailWebLayout";
import RetailPosLayout from "../layouts/retail/RetailPosLayout";
import PharmacyWebLayout from "../layouts/pharmacy/WebLayout";
import PharmacyPosLayout from "../layouts/pharmacy/PosLayout";
import HealthcareWebLayout from "../layouts/healthcare/WebLayout";
import HealthcarePosLayout from "../layouts/healthcare/PosLayout";
import EducationWebLayout from "../layouts/education/WebLayout";
import EducationPosLayout from "../layouts/education/PosLayout";
import EcommerceWebLayout from "../layouts/ecommerce/WebLayout";
import EcommercePosLayout from "../layouts/ecommerce/PosLayout";
import ServiceWebLayout from "../layouts/service/WebLayout";
import ServicePosLayout from "../layouts/service/PosLayout";
import BaseWebLayout from "../layouts/common/BaseWebLayout";

import { fnbWebNav, fnbPosNav } from "../layouts/fnb/navItems";
import { retailWebNav } from "../layouts/retail/navItems";
import { pharmacyWebNav, pharmacyPosNav } from "../layouts/pharmacy/navItems";
import { healthcareWebNav, healthcarePosNav } from "../layouts/healthcare/navItems";
import { educationWebNav, educationPosNav } from "../layouts/education/navItems";
import { ecommerceWebNav, ecommercePosNav } from "../layouts/ecommerce/navItems";
import { serviceWebNav, servicePosNav } from "../layouts/service/navItems";
import { commonWebNav } from "../layouts/common/baseNavItems";

export const layoutRegistry = {
    FNB: {
        web: {
            OWNER: { layout: BaseWebLayout, props: { title: "FNB Admin", navItems: fnbWebNav.manager } },
            MANAGER: { layout: BaseWebLayout, props: { title: "FNB Manager", navItems: fnbWebNav.manager } },
            ADMIN: { layout: BaseWebLayout, props: { title: "FNB Admin", navItems: fnbWebNav.admin } },
            STAFF: { layout: BaseWebLayout, props: { title: "FNB Staff", navItems: fnbWebNav.staff } },
        },
        pos: {
            OWNER: { layout: FnbPosLayout, props: { title: "FNB POS Admin", navItems: fnbPosNav.admin } },
            MANAGER: { layout: FnbPosLayout, props: { title: "FNB POS Manager", navItems: fnbPosNav.admin } },
            ADMIN: { layout: FnbPosLayout, props: { title: "FNB POS Admin", navItems: fnbPosNav.admin } },
            STAFF: { layout: FnbPosLayout, props: { title: "FNB POS Staff", navItems: fnbPosNav.staff } },
        },
    },

    RETAIL: {
        web: {
            OWNER: { layout: BaseWebLayout, props: { title: "Retail Manager", navItems: retailWebNav.manager } },
            MANAGER: { layout: BaseWebLayout, props: { title: "Retail Manager", navItems: retailWebNav.manager } },
            ADMIN: { layout: BaseWebLayout, props: { title: "Retail Admin", navItems: retailWebNav.manager } },
            STAFF: { layout: BaseWebLayout, props: { title: "Retail Staff", navItems: retailWebNav.staff } },
        },
        pos: {
            OWNER: { layout: RetailPosLayout, props: { title: "Retail POS Manager" } },
            MANAGER: { layout: RetailPosLayout, props: { title: "Retail POS Manager" } },
            ADMIN: { layout: RetailPosLayout, props: { title: "Retail POS Admin" } },
            STAFF: { layout: RetailPosLayout, props: { title: "Retail POS Staff" } },
        },
    },

    PHARMACY: {
        web: {
            OWNER: { layout: BaseWebLayout, props: { title: "Pharmacy Admin", navItems: pharmacyWebNav.admin } },
            MANAGER: { layout: BaseWebLayout, props: { title: "Pharmacy Manager", navItems: pharmacyWebNav.manager } },
            ADMIN: { layout: BaseWebLayout, props: { title: "Pharmacy Admin", navItems: pharmacyWebNav.admin } },
            STAFF: { layout: BaseWebLayout, props: { title: "Pharmacy Staff", navItems: pharmacyWebNav.staff } },
        },
        pos: {
            OWNER: { layout: PharmacyPosLayout, props: { title: "Pharmacy POS Admin", navItems: pharmacyPosNav.admin } },
            MANAGER: { layout: PharmacyPosLayout, props: { title: "Pharmacy POS Manager", navItems: pharmacyPosNav.admin } },
            ADMIN: { layout: PharmacyPosLayout, props: { title: "Pharmacy POS Admin", navItems: pharmacyPosNav.admin } },
            STAFF: { layout: PharmacyPosLayout, props: { title: "Pharmacy POS Staff", navItems: pharmacyPosNav.staff } },
        },
    },

    HEALTHCARE: {
        web: {
            OWNER: { layout: BaseWebLayout, props: { title: "Healthcare Admin", navItems: healthcareWebNav.admin } },
            MANAGER: { layout: BaseWebLayout, props: { title: "Healthcare Manager", navItems: healthcareWebNav.manager } },
            ADMIN: { layout: BaseWebLayout, props: { title: "Healthcare Admin", navItems: healthcareWebNav.admin } },
            STAFF: { layout: BaseWebLayout, props: { title: "Healthcare Staff", navItems: healthcareWebNav.staff } },
        },
        pos: {
            OWNER: { layout: HealthcarePosLayout, props: { title: "Healthcare POS Admin", navItems: healthcarePosNav.admin } },
            MANAGER: { layout: HealthcarePosLayout, props: { title: "Healthcare POS Manager", navItems: healthcarePosNav.admin } },
            ADMIN: { layout: HealthcarePosLayout, props: { title: "Healthcare POS Admin", navItems: healthcarePosNav.admin } },
            STAFF: { layout: HealthcarePosLayout, props: { title: "Healthcare POS Staff", navItems: healthcarePosNav.staff } },
        },
    },

    EDUCATION: {
        web: {
            OWNER: { layout: BaseWebLayout, props: { title: "Education Admin", navItems: educationWebNav.admin } },
            MANAGER: { layout: BaseWebLayout, props: { title: "Education Manager", navItems: educationWebNav.manager } },
            ADMIN: { layout: BaseWebLayout, props: { title: "Education Admin", navItems: educationWebNav.admin } },
            STAFF: { layout: BaseWebLayout, props: { title: "Education Staff", navItems: educationWebNav.staff } },
        },
        pos: {
            OWNER: { layout: EducationPosLayout, props: { title: "Education POS Admin", navItems: educationPosNav.admin } },
            MANAGER: { layout: EducationPosLayout, props: { title: "Education POS Manager", navItems: educationPosNav.admin } },
            ADMIN: { layout: EducationPosLayout, props: { title: "Education POS Admin", navItems: educationPosNav.admin } },
            STAFF: { layout: EducationPosLayout, props: { title: "Education POS Staff", navItems: educationPosNav.staff } },
        },
    },

    ECOMMERCE: {
        web: {
            OWNER: { layout: BaseWebLayout, props: { title: "Ecommerce Admin", navItems: ecommerceWebNav.admin } },
            MANAGER: { layout: BaseWebLayout, props: { title: "Ecommerce Manager", navItems: ecommerceWebNav.manager } },
            ADMIN: { layout: BaseWebLayout, props: { title: "Ecommerce Admin", navItems: ecommerceWebNav.admin } },
            STAFF: { layout: BaseWebLayout, props: { title: "Ecommerce Staff", navItems: ecommerceWebNav.staff } },
        },
        pos: {
            OWNER: { layout: EcommercePosLayout, props: { title: "Ecommerce POS Admin", navItems: ecommercePosNav.admin } },
            MANAGER: { layout: EcommercePosLayout, props: { title: "Ecommerce POS Manager", navItems: ecommercePosNav.admin } },
            ADMIN: { layout: EcommercePosLayout, props: { title: "Ecommerce POS Admin", navItems: ecommercePosNav.admin } },
            STAFF: { layout: EcommercePosLayout, props: { title: "Ecommerce POS Staff", navItems: ecommercePosNav.staff } },
        },
    },

    SERVICE: {
        web: {
            OWNER: { layout: BaseWebLayout, props: { title: "Service Admin", navItems: serviceWebNav.admin } },
            MANAGER: { layout: BaseWebLayout, props: { title: "Service Manager", navItems: serviceWebNav.manager } },
            ADMIN: { layout: BaseWebLayout, props: { title: "Service Admin", navItems: serviceWebNav.admin } },
            STAFF: { layout: BaseWebLayout, props: { title: "Service Staff", navItems: serviceWebNav.staff } },
        },
        pos: {
            OWNER: { layout: ServicePosLayout, props: { title: "Service POS Admin", navItems: servicePosNav.admin } },
            MANAGER: { layout: ServicePosLayout, props: { title: "Service POS Manager", navItems: servicePosNav.admin } },
            ADMIN: { layout: ServicePosLayout, props: { title: "Service POS Admin", navItems: servicePosNav.admin } },
            STAFF: { layout: ServicePosLayout, props: { title: "Service POS Staff", navItems: servicePosNav.staff } },
        },
    },

    COMMON: {
        web: {
            USER: { layout: BaseWebLayout, props: { title: "Common Web Customers", navItems: commonWebNav.user } },
        },
        pos: {
            USER: { layout: BaseWebLayout, props: { title: "Common POS Customers", navItems: commonWebNav.user } },
        }
    }
};
