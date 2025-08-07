export const getFirstValidNavItem = (navItems) => {
    if (!Array.isArray(navItems)) return null;

    for (const item of navItems) {
        // Bỏ qua navItem chỉ có onClick mà không có to
        if (item?.to) return item;

        // Nếu là group (subNav), kiểm tra trong subNav
        if (Array.isArray(item?.items)) {
            const subItem = getFirstValidNavItem(item.items);
            if (subItem?.to) return subItem;
        }
    }

    return null;
};
