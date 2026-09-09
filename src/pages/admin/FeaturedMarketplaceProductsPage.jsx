import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ChevronsUpDown, Package, Search, Star, X } from "lucide-react";
import { adminAPI } from "../../api/axios";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatCard } from "../../components/cards/StatCard";

const tabClass = (active) =>
  `min-h-[44px] px-4 py-2 rounded-xl font-medium transition-ui tap-feedback ${
    active
      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-[var(--shadow-glow)]"
      : "bg-surface-soft border border-white/10 text-text-secondary hover:bg-hover hover:text-text-primary"
  }`;

function formatPrice(price) {
  return `NPR ${Number(price ?? 0).toLocaleString()}`;
}

function VendorSearchDropdown({
  vendors,
  loading,
  selectedVendorId,
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId) || null,
    [vendors, selectedVendorId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        String(v.name || "")
          .toLowerCase()
          .includes(q) ||
        String(v.email || "")
          .toLowerCase()
          .includes(q),
    );
  }, [vendors, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const label = selected
    ? selected.name
    : loading
      ? "Loading vendors…"
      : "All vendors";

  return (
    <div ref={rootRef} className="relative w-full sm:max-w-sm">
      <span className="block text-xs uppercase tracking-wide text-text-muted mb-1.5">
        Vendor filter
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[44px] px-3 rounded-xl bg-input border border-white/10 text-left text-text-primary flex items-center justify-between gap-2 hover:bg-hover focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <span className="truncate">{label}</span>
        <span className="flex items-center gap-1 shrink-0">
          {selectedVendorId ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear vendor filter"
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onSelect("");
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect("");
                  setOpen(false);
                }
              }}
            >
              <X className="w-4 h-4" />
            </span>
          ) : null}
          <ChevronsUpDown className="w-4 h-4 text-text-muted" />
        </span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-white/10 bg-surface-soft shadow-[var(--shadow-card)] overflow-hidden">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search vendors…"
                className="w-full min-h-[40px] pl-9 pr-3 rounded-lg bg-input border border-white/10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto admin-scroll py-1"
          >
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!selectedVendorId}
                className={`w-full text-left px-3 py-2.5 text-sm min-h-[44px] hover:bg-hover ${
                  !selectedVendorId
                    ? "text-accent bg-primary/10"
                    : "text-text-primary"
                }`}
                onClick={() => {
                  onSelect("");
                  setOpen(false);
                }}
              >
                All vendors
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-text-muted">
                No vendors match “{query.trim()}”
              </li>
            ) : (
              filtered.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedVendorId === v.id}
                    className={`w-full text-left px-3 py-2.5 min-h-[44px] hover:bg-hover ${
                      selectedVendorId === v.id
                        ? "text-accent bg-primary/10"
                        : "text-text-primary"
                    }`}
                    onClick={() => {
                      onSelect(v.id);
                      setOpen(false);
                    }}
                  >
                    <span className="block font-medium truncate">{v.name}</span>
                    <span className="block text-xs text-text-muted truncate">
                      {v.email || "No email"}
                      {v.productCount != null
                        ? ` · ${v.productCount} product${
                            v.productCount === 1 ? "" : "s"
                          }`
                        : ""}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function FeaturedMarketplaceProductsPage() {
  const [list, setList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [featuredCount, setFeaturedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState(""); // '' | 'featured' | 'not_featured'
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState("");

  const loadVendors = useCallback(async () => {
    setVendorsLoading(true);
    try {
      const res = await adminAPI.getMarketplaceVendors();
      setVendors(res?.data?.data || []);
    } catch {
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: perPage };
      if (search) params.search = search;
      if (filter === "featured") params.featured = "true";
      if (filter === "not_featured") params.featured = "false";
      if (selectedVendorId) params.sellerUserId = selectedVendorId;

      const res = await adminAPI.getMarketplaceProducts(params);
      setList(res?.data?.data || []);
      setPagination(
        res?.data?.pagination || {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: perPage,
        },
      );
      setFeaturedCount(Number(res?.data?.meta?.featuredCount) || 0);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load marketplace products.";
      setError(message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, filter, selectedVendorId]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedVendorId(vendorId || "");
    setPage(1);
  };

  const handleToggle = async (product) => {
    if (!product?.id || togglingId) return;
    const nextFeatured = !product.isHomepageFeatured;
    setTogglingId(product.id);
    try {
      await adminAPI.setHomepageFeatured(product.id, {
        featured: nextFeatured,
      });
      toast.success(
        nextFeatured
          ? "Product added to homepage Featured Marketplace"
          : "Product removed from homepage Featured Marketplace",
      );
      await load();
      await loadVendors();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not update featured status.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">
          Featured Marketplace Products
        </h1>
        <p className="text-text-primary text-sm mt-1">
          Click a product to show or hide it on the homepage Featured Marketplace
          section.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-2 md:gap-4">
        <StatCard
          compact
          title="Featured on homepage"
          value={featuredCount}
          icon={<Star className="w-5 h-5" />}
        />
        <StatCard
          compact
          title="Products in view"
          value={pagination.totalItems || 0}
          icon={<Package className="w-5 h-5" />}
        />
      </section>

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search product, vendor, category…"
            className="w-full min-h-[44px] pl-10 pr-3 rounded-xl bg-input border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
        <VendorSearchDropdown
          vendors={vendors}
          loading={vendorsLoading}
          selectedVendorId={selectedVendorId}
          onSelect={handleVendorSelect}
        />

        <div className="flex flex-wrap gap-2" role="tablist">
          <button
            type="button"
            onClick={() => {
              setFilter("");
              setPage(1);
            }}
            className={tabClass(filter === "")}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("featured");
              setPage(1);
            }}
            className={tabClass(filter === "featured")}
          >
            Featured
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("not_featured");
              setPage(1);
            }}
            className={tabClass(filter === "not_featured")}
          >
            Not featured
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => setError("")}>
            Dismiss
          </Button>
        </div>
      ) : null}

      <Card padding={false}>
        {loading && !list.length ? (
          <div className="p-4 sm:p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : !list.length ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            No marketplace products found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl overflow-hidden">
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="bg-input border-b border-accent">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent">
                      Product
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent">
                      Vendor
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent">
                      Price
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((product) => {
                    const featured = Boolean(product.isHomepageFeatured);
                    return (
                      <tr
                        key={product.id}
                        className={`border-b border-accent/40 text-[#FFFFFF] transition-shadow admin-table-row-hover hover:bg-hover/30 cursor-pointer ${
                          featured ? "bg-primary/5" : ""
                        }`}
                        onClick={() => handleToggle(product)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-hover shrink-0 border border-white/10">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-muted">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-text-muted truncate">
                                {product.category || "Uncategorized"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">
                            {product.sellerDisplayName}
                          </p>
                          <p className="text-xs text-text-muted truncate max-w-[180px]">
                            {product.sellerEmail || "—"}
                          </p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {formatPrice(product.price)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={featured ? "success" : "default"}>
                            {featured ? "Featured" : "Not featured"}
                          </Badge>
                        </td>
                        <td
                          className="py-3 px-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant={featured ? "secondary" : "primary"}
                            loading={togglingId === product.id}
                            onClick={() => handleToggle(product)}
                          >
                            {featured ? "Remove" : "Feature"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-white/5">
              {list.map((product) => {
                const featured = Boolean(product.isHomepageFeatured);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleToggle(product)}
                    disabled={togglingId === product.id}
                    className={`w-full text-left p-4 flex gap-3 items-start tap-feedback ${
                      featured ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-hover shrink-0 border border-white/10">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-text-primary line-clamp-2">
                          {product.name}
                        </p>
                        <Badge variant={featured ? "success" : "default"}>
                          {featured ? "Featured" : "Off"}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {product.sellerDisplayName}
                      </p>
                      <p className="text-sm text-accent">
                        {formatPrice(product.price)}
                      </p>
                      <p className="text-xs text-text-muted">
                        Tap to {featured ? "remove from" : "add to"} homepage
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Pagination
        currentPage={pagination.currentPage || page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.totalItems || 0}
        itemsPerPage={perPage}
        onPageChange={setPage}
        onItemsPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />
    </div>
  );
}
