import { useEffect, useState } from "react";
import { Field } from "./Feedback";

type Area = { code: number; name: string; wards?: Area[] };
// v1 contains the pre-merger provinces, districts and wards only.
const baseUrl = "https://provinces.open-api.vn/api/v1";
const cache = new Map<string, Area[]>();

async function loadAreas(path: string, signal: AbortSignal): Promise<Area[]> {
  const cached = cache.get(path);
  if (cached) return cached;
  const response = await fetch(`${baseUrl}${path}`, { signal });
  if (!response.ok) throw new Error("Không thể tải danh sách địa chỉ.");
  const data = await response.json();
  const areas: Area[] = Array.isArray(data) ? data : data.districts;
  if (!Array.isArray(areas)) throw new Error("Dữ liệu địa chỉ không hợp lệ.");
  cache.set(path, areas);
  return areas;
}

function useAreas(path: string) {
  const [state, setState] = useState({ path: "", version: -1, items: [] as Area[], loading: false, error: "" });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    loadAreas(path, controller.signal).then(
      (items) => { if (!controller.signal.aborted) setState({ path, version, items, loading: false, error: "" }); },
      () => { if (!controller.signal.aborted) setState({ path, version, items: [], loading: false, error: "Không tải được địa chỉ. Vui lòng thử lại." }); },
    );
    return () => controller.abort();
  }, [path, version]);
  return { ...(state.path === path && state.version === version ? state : { items: [], loading: !!path, error: "" }), retry: () => setVersion((v) => v + 1) };
}

export function AddressFields({ province, ward: storedWard, wardName = "ward", withStreet = false, errors = {}, onChange }: {
  province: string;
  ward: string;
  wardName?: string;
  withStreet?: boolean;
  errors?: { province?: string; ward?: string };
  onChange: (province: string, ward: string) => void;
}) {
  const provinces = useAreas("/p/");
  const selected = provinces.items.find((item) => item.name === province);
  const districts = useAreas(selected ? `/p/${selected.code}?depth=3` : "");
  const matchedWard = withStreet ? districts.items.flatMap((item) => item.wards || [])
    .find((item) => storedWard === item.name || storedWard.endsWith(`, ${item.name}`)) : undefined;
  const ward = withStreet ? matchedWard?.name || "" : storedWard;
  const street = withStreet ? matchedWard
    ? storedWard === ward ? "" : storedWard.slice(0, -(ward.length + 2))
    : storedWard : "";
  function changeAddress(nextProvince: string, nextWard: string, nextStreet = street) {
    onChange(nextProvince, withStreet ? [nextStreet, nextWard].filter(Boolean).join(", ") : nextWard);
  }
  const [districtChoice, setDistrictChoice] = useState<{ province: string; code: string } | null>(null);
  // Existing records store the ward name. Restore the district only when unambiguous.
  const matches = ward ? districts.items.filter((district) => district.wards?.some((item) => item.name === ward)) : [];
  const districtCode = districtChoice?.province === province
    ? districtChoice.code
    : matches.length === 1 ? String(matches[0].code) : "";
  const district = districts.items.find((item) => String(item.code) === districtCode);
  const wards = district?.wards || [];
  return <>
    <div className="two-cols">
      <Field name="province" label="Tỉnh / thành phố" error={errors.province}>
        <select id="province" name="province" value={province} disabled={provinces.loading || !!provinces.error}
          aria-invalid={!!errors.province} aria-describedby={errors.province ? "province-error" : undefined}
          onChange={(event) => {
            setDistrictChoice({ province: event.target.value, code: "" });
            changeAddress(event.target.value, "");
          }}>
          <option value="">{provinces.loading ? "Đang tải tỉnh / thành phố…" : "Chọn tỉnh / thành phố"}</option>
          {province && !selected && <option value={province} disabled hidden>{province} (đã lưu)</option>}
          {provinces.items.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
        </select>
      </Field>
      <Field name={`${wardName}-district`} label="Quận / huyện">
        <select id={`${wardName}-district`} name={`${wardName}-district`} value={districtCode}
          disabled={!selected || districts.loading || !!districts.error}
          onChange={(event) => {
            setDistrictChoice({ province, code: event.target.value });
            changeAddress(province, "");
          }}>
          <option value="">{!selected ? "Chọn tỉnh / thành phố trước" : districts.loading ? "Đang tải quận / huyện…" : "Chọn quận / huyện"}</option>
          {districts.items.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select>
      </Field>
      <Field name={wardName} label="Xã / phường" error={errors.ward}>
        <select id={wardName} name={wardName} value={wards.some((item) => item.name === ward) ? ward : ""}
          disabled={!district || districts.loading || !!districts.error}
          aria-invalid={!!errors.ward} aria-describedby={errors.ward ? `${wardName}-error` : undefined}
          onChange={(event) => changeAddress(province, event.target.value)}>
          <option value="">{!district ? "Chọn quận / huyện trước" : "Chọn xã / phường"}</option>
          {wards.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
        </select>
      </Field>
    </div>
    {withStreet && <Field name={`${wardName}-street`} label="Địa chỉ cụ thể" error={errors.ward}>
      <input id={`${wardName}-street`} name={`${wardName}-street`} value={street}
        disabled={districts.loading || !!districts.error}
        maxLength={Math.max(0, 150 - (ward ? ward.length + 2 : 0))}
        placeholder="Ví dụ: 123 Nguyễn Huệ, tầng 3, tòa nhà ABC"
        aria-invalid={!!errors.ward}
        onChange={(event) => changeAddress(province, ward, event.target.value)} />
    </Field>}
    {ward && !wards.some((item) => item.name === ward) && <p className="hint">
      {"\u0110\u1ecba ch\u1ec9 \u0111\u00e3 l\u01b0u: "}{ward}
      <button type="button" className="secondary" onClick={() => onChange(province, "")}>{"X\u00f3a"}</button>
    </p>}
    {[provinces, districts].filter((areas) => areas.error).map((areas, index) => <div className="alert" role="alert" key={index}>
      {areas.error} <button type="button" className="secondary" onClick={areas.retry}>Thử lại</button>
    </div>)}
  </>;
}
