import requests
import pandas as pd
import numpy as np
import json
import os
import time
from datetime import datetime
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import geopandas as gpd
import folium
from folium.features import GeoJsonTooltip

DCS_POVERTY_LINES_MAR2026 = {
    "Colombo"       : 18000,
    "Gampaha"       : 17908,
    "Kalutara"      : 17520,
    "Kandy"         : 16942,
    "Matale"        : 16918,
    "Nuwara Eliya"  : 17551,
    "Galle"         : 16958,
    "Matara"        : 16918,
    "Hambantota"    : 16216,
    "Jaffna"        : 16288,
    "Kilinochchi"   : 16124,
    "Mannar"        : 17095,
    "Vavuniya"      : 16673,
    "Mullaitivu"    : 16573,
    "Batticaloa"    : 16781,
    "Ampara"        : 16823,
    "Trincomalee"   : 16262,
    "Kurunegala"    : 16395,
    "Puttalam"      : 17037,
    "Anuradhapura"  : 16288,
    "Polonnaruwa"   : 16331,
    "Badulla"       : 16814,
    "Monaragala"    : 15958,
    "Ratnapura"     : 16764,
    "Kegalle"       : 17451,
}
NATIONAL_POVERTY_LINE_MAR2026 = 16730 
DCS_HIES2019_HEADCOUNT = {
    "Colombo"       : 2.3,
    "Gampaha"       : 5.7,
    "Kalutara"      : 12.2,
    "Kandy"         : 14.3,
    "Matale"        : 19.6,
    "Nuwara Eliya"  : 26.3,
    "Galle"         : 13.2,
    "Matara"        : 11.1,
    "Hambantota"    : 13.6,
    "Jaffna"        : 25.8,
    "Kilinochchi"   : 26.4,
    "Mannar"        : 8.0,
    "Vavuniya"      : 13.9,
    "Mullaitivu"    : 44.5,
    "Batticaloa"    : 20.8,
    "Ampara"        : 17.2,
    "Trincomalee"   : 18.3,
    "Kurunegala"    : 12.5,
    "Puttalam"      : 10.5,
    "Anuradhapura"  : 8.1,
    "Polonnaruwa"   : 17.0,
    "Badulla"       : 32.3,
    "Monaragala"    : 21.0,
    "Ratnapura"     : 24.9,
    "Kegalle"       : 20.8,
}

GN_TO_DISTRICT = {
    "Walpita"       : "Colombo",
    "Padukka"       : "Colombo",
    "Homagama"      : "Colombo",
    "Godagandeniya" : "Kegalle",
    "Kegalle"       : "Kegalle",
    "Warakapola"    : "Kegalle",
    "Godagandeniya" : "Kandy",
    "Gampaha"       : "Gampaha",
    "Jaffna"        : "Jaffna",
    "Galle"         : "Galle",
}

WB_INDICATORS = {
    "EG.ELC.ACCS.ZS"       : ("Electricity Access %",   95.0),
    "SH.H2O.BASW.ZS"       : ("Safe Water Access %",    91.0),
    "SH.STA.BASS.ZS"       : ("Sanitation Access %",    88.0),
    "SL.UEM.TOTL.ZS"       : ("Unemployment Rate %",     5.0),
    "SE.ADT.LITR.ZS"       : ("Adult Literacy Rate %",  92.0),
}

def fetch_world_bank(country="LKA") -> dict:
    print("\n FETCHING WORLD BANK API (national indicators)")
    results = {}
    for code, (label, fallback) in WB_INDICATORS.items():
        url = (
            f"https://api.worldbank.org/v2/country/{country}"
            f"/indicator/{code}?format=json&mrv=5&per_page=10"
        )
        try:
            r = requests.get(url, timeout=15)
            if r.status_code == 200:
                data = r.json()
                if len(data) > 1 and data[1]:
                    for entry in data[1]:
                        if entry.get("value") is not None:
                            results[code] = {
                                "value" : round(float(entry["value"]), 2),
                                "year"  : entry.get("date", "unknown"),
                                "source": "World Bank API",
                            }
                            print(f" {label:<28} "
                                  f"{results[code]['value']:>7.1f}  "
                                  f"({results[code]['year']})")
                            break
        except Exception as e:
            print(f" {label}: API error — {e}")

        if code not in results:
            results[code] = {
                "value" : fallback,
                "year"  : "fallback",
                "source": "fallback",
            }
            print(f"  {label:<28} {fallback:>7.1f}  (fallback)")
        time.sleep(0.25)

    return results

def build_district_dataframe(national: dict) -> pd.DataFrame:
    print("\n BUILDING DISTRICT DATASET")

    nat_elec  = national.get("EG.ELC.ACCS.ZS", {}).get("value", 95.0)
    nat_water = national.get("SH.H2O.BASW.ZS", {}).get("value", 91.0)
    nat_sani  = national.get("SH.STA.BASS.ZS", {}).get("value", 88.0)
    nat_unemp = national.get("SL.UEM.TOTL.ZS", {}).get("value",  5.0)

    rows = []
    for district, line in DCS_POVERTY_LINES_MAR2026.items():
        headcount = DCS_HIES2019_HEADCOUNT.get(district, 5.0)
        col_ratio = line / NATIONAL_POVERTY_LINE_MAR2026
        modelled_elec  = min(nat_elec  * (1 / col_ratio) * 0.98 + col_ratio * 2, 100)
        modelled_water = min(nat_water * (1 / col_ratio) * 0.97 + col_ratio * 2, 100)
        modelled_sani  = min(nat_sani  * (1 / col_ratio) * 0.97 + col_ratio * 2, 100)
        modelled_unemp = min(nat_unemp * col_ratio * 1.02, 20)
        no_elec  = round(100 - modelled_elec,  2)
        no_water = round(100 - modelled_water, 2)
        no_sani  = round(100 - modelled_sani,  2)
        unemp    = round(modelled_unemp,       2)

        rows.append({
            "district"            : district,
            "poverty_line_mar2026": line,          
            "headcount_2019"      : headcount,      
            "col_ratio"           : round(col_ratio, 4),
            "no_electricity"      : no_elec,
            "no_safe_water"       : no_water,
            "no_sanitation"       : no_sani,
            "unemployment"        : unemp,
            "poverty_line_source" : "DCS Mar 2026",
            "headcount_source"    : "DCS HIES 2019",
            "infra_source"        : f"World Bank API {national.get('EG.ELC.ACCS.ZS',{}).get('year','?')} national * col_ratio",
        })

    df = pd.DataFrame(rows)
    print(f"  Built {len(df)} district records")
    print(f"  Poverty line range: Rs.{df['poverty_line_mar2026'].min():,} "
          f"- Rs.{df['poverty_line_mar2026'].max():,}")
    print(f"  Headcount range: {df['headcount_2019'].min():.1f}% "
          f"- {df['headcount_2019'].max():.1f}%")
    return df

def compute_dpi(df: pd.DataFrame) -> pd.DataFrame:
    print("\n COMPUTING DISTRICT POVERTY INDEX (DPI)")
    df = df.copy()
    df["poverty_line_norm_raw"] = df["poverty_line_mar2026"]

    indicators = {
        "headcount_2019"          : 0.35,
        "poverty_line_norm_raw"   : 0.20,
        "no_electricity"          : 0.15,
        "no_safe_water"           : 0.15,
        "no_sanitation"           : 0.08,
        "unemployment"            : 0.07,
    }

    for col in indicators:
        lo, hi = df[col].min(), df[col].max()
        if hi > lo:
            df[f"{col}_norm"] = ((df[col] - lo) / (hi - lo)) * 100
        else:
            df[f"{col}_norm"] = 50.0

    df["dpi"] = sum(
        df[f"{col}_norm"] * w
        for col, w in indicators.items()
    ).round(2)

    df["dpi_label"] = pd.cut(
        df["dpi"],
        bins=[-1, 40, 70, 101],
        labels=["Stable", "Moderate", "High"]
    ).astype(str)

    bonus_map = {
        "High"         : 5.0,
        "Moderate"     : 2.5,
        "Stable"       : 0.0,
    }
    df["urgency_bonus"] = df["dpi_label"].map(bonus_map).fillna(0.0)

    print(f"\n  {'District':<18} {'Poverty Line':>13} "
          f"{'HC%':>6} {'DPI':>6} {'Label':<14} {'Bonus':>5}")
    print("  " + "-" * 66)
    for _, r in df.sort_values("dpi", ascending=False).iterrows():
        print(f"  {r['district']:<18} "
              f"Rs.{int(r['poverty_line_mar2026']):>7,} "
              f"{r['headcount_2019']:>5.1f}% "
              f"{r['dpi']:>6.1f} "
              f"{r['dpi_label']:<14} "
              f"+{r['urgency_bonus']:.1f}")
    return df

def cluster_districts(df: pd.DataFrame, n_clusters: int = 3) -> pd.DataFrame:
    print("\n K-MEANS DISTRICT CLUSTERING")

    features = df[["dpi", "headcount_2019", "col_ratio",
                   "no_electricity", "no_safe_water"]].values

    scaler = StandardScaler()
    X      = scaler.fit_transform(features)

    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = km.fit_predict(X)
    df = df.copy()
    df["cluster_raw"] = labels

    cluster_dpi = df.groupby("cluster_raw")["dpi"].mean().sort_values()
    label_map   = {}
    vuln_labels = ["Stable", "Moderate", "High"]
    for i, (cluster_id, _) in enumerate(cluster_dpi.items()):
        label_map[cluster_id] = vuln_labels[i % len(vuln_labels)]

    df["cluster"]       = df["cluster_raw"].map(label_map)
    df["cluster_id"]    = df["cluster_raw"]

    print(f"  Clusters found : {n_clusters}")
    print(f"  Inertia        : {km.inertia_:.2f}")
    for label in ["High", "Moderate", "Stable"]:
        count = (df["cluster"] == label).sum()
        members = df[df["cluster"] == label]["district"].tolist()
        print(f"  {label:<12}: {count} districts — {', '.join(members[:4])}"
              f"{'...' if len(members) > 4 else ''}")

    return df

def generate_map(df: pd.DataFrame,
                 output="outputs/district_map.html"):
    print("\n GENERATING MAP")
    os.makedirs(os.path.dirname(output), exist_ok=True)

    geojson_path = "data/sri_lanka_districts.geojson"
    if not os.path.exists(geojson_path):
        print("  Downloading GADM GeoJSON...")
        try:
            os.makedirs("data", exist_ok=True)
            url = ("https://geodata.ucdavis.edu/gadm/gadm4.1/json/"
                   "gadm41_LKA_2.json")
            r = requests.get(url, timeout=60)
            open(geojson_path, "w", encoding="utf-8").write(r.text)
            print(f"  Saved - {geojson_path}")
        except Exception as e:
            print(f"   Download failed: {e} — using circle markers")
            return _generate_circle_map(df, output)

    try:
        gdf = gpd.read_file(geojson_path)
        name_fixes = {
            "Nuwara-Eliya": "Nuwara Eliya",
            "Nuwaraeliya":  "Nuwara Eliya",
            "Mullativu":    "Mullaitivu",
        }
        gdf["district"] = (
            gdf["NAME_2"].str.strip().str.title()
                        .replace(name_fixes)
        )
        merged = gdf.merge(df, on="district", how="left").to_crs(epsg=4326)
        merged["dpi"]            = merged["dpi"].fillna(0)
        merged["dpi_label"]      = merged["dpi_label"].fillna("Unknown")
        merged["urgency_bonus"]  = merged["urgency_bonus"].fillna(0)
        merged["headcount_2019"] = merged["headcount_2019"].fillna(0)
        merged["poverty_line_mar2026"] = merged["poverty_line_mar2026"].fillna(0)

        m = folium.Map(
            location=[7.8731, 80.7718],
            zoom_start=7.5,
            tiles="CartoDB positron",
            prefer_canvas=True
        )

        folium.Choropleth(
            geo_data=merged.__geo_interface__,
            name="District Poverty Index",
            data=merged[["district","dpi"]],
            columns=["district","dpi"],
            key_on="feature.properties.district",
            fill_color="RdYlGn_r",
            fill_opacity=0.78,
            line_opacity=0.5,
            line_color="white",
            line_weight=1.5,
            legend_name="District Poverty Index (DPI) — HopeLink 2026",
            nan_fill_color="lightgrey",
            bins=[0, 20, 35, 55, 70, 85, 100],
            highlight=True,
        ).add_to(m)

        folium.GeoJson(
            merged.__geo_interface__,
            style_function=lambda x: {"fillOpacity": 0, "weight": 0},
            highlight_function=lambda x: {
                "fillOpacity": 0.15,
                "weight": 2.5,
                "color": "#065F46"
            },
            tooltip=GeoJsonTooltip(
                fields=[
                    "district", "dpi", "dpi_label",
                    "poverty_line_mar2026", "headcount_2019",
                    "urgency_bonus", "cluster"
                ],
                aliases=[
                    "District:", "DPI Score:", "Category:",
                    "Poverty Line (Mar 2026 Rs.):",
                    "Poverty Rate (2019 %):",
                    "Urgency Bonus (+pts):",
                    "Cluster:",
                ],
                sticky=True,
                style=(
                    "background-color:white;"
                    "border:1px solid #e2e8f0;"
                    "border-radius:10px;"
                    "padding:10px 14px;"
                    "font-family:Arial,sans-serif;"
                    "font-size:12px;"
                    "box-shadow:0 4px 16px rgba(0,0,0,0.1);"
                )
            )
        ).add_to(m)

        note = """
        <div style="position:fixed;bottom:24px;left:24px;z-index:1000;
                    background:white;padding:10px 14px;border-radius:10px;
                    border:1px solid #e2e8f0;font-family:Arial;
                    font-size:11px;color:#64748b;max-width:280px;">
          <strong style="color:#065F46;">Data Sources</strong><br>
           DCS Sri Lanka Poverty Lines — January 2026<br>
          DCS HIES 2019 — District Headcount Ratios<br>
           World Bank Open Data API (national indicators)<br>
          K-Means Clustering (3 clusters, scikit-learn)<br>
          <em style="font-size:10px;">HopeLink Foundation District Analysis</em>
        </div>
        """
        m.get_root().html.add_child(folium.Element(note))
        folium.LayerControl().add_to(m)
        m.save(output)
        print(f"  Choropleth map saved → {output}")
        return output

    except Exception as e:
        print(f"    GeoJSON merge failed: {e}")
        return _generate_circle_map(df, output)


def _generate_circle_map(df: pd.DataFrame, output: str):
    COORDS = {
        "Colombo":(6.9271,79.8612),"Gampaha":(7.0840,80.0098),
        "Kalutara":(6.5854,79.9607),"Kandy":(7.2906,80.6337),
        "Matale":(7.4675,80.6234),"Nuwara Eliya":(6.9497,80.7891),
        "Galle":(6.0535,80.2210),"Matara":(5.9549,80.5550),
        "Hambantota":(6.1429,81.1212),"Jaffna":(9.6615,80.0255),
        "Kilinochchi":(9.3803,80.3770),"Mannar":(8.9810,79.9044),
        "Vavuniya":(8.7514,80.4971),"Mullaitivu":(9.2671,80.8128),
        "Batticaloa":(7.7102,81.6924),"Ampara":(7.2985,81.6747),
        "Trincomalee":(8.5874,81.2152),"Kurunegala":(7.4863,80.3647),
        "Puttalam":(8.0362,79.8283),"Anuradhapura":(8.3114,80.4037),
        "Polonnaruwa":(7.9403,81.0188),"Badulla":(6.9934,81.0550),
        "Monaragala":(6.8728,81.3507),"Ratnapura":(6.6828,80.3992),
        "Kegalle":(7.2513,80.3464),
    }
    COLORS = {"High":"#ef4444","Moderate-High":"#f59e0b",
              "Moderate":"#3b82f6","Stable":"#10b981","Unknown":"#cbd5e1"}

    m = folium.Map(location=[7.8731,80.7718],zoom_start=7.5,
                   tiles="CartoDB positron")
    for _, row in df.iterrows():
        coords = COORDS.get(row["district"])
        if not coords: continue
        color  = COLORS.get(row.get("dpi_label","Unknown"), "#cbd5e1")
        radius = max(8, min(26, row["dpi"] * 0.26))
        folium.CircleMarker(
            location=coords, radius=radius,
            color=color, fill_color=color,
            fill_opacity=0.82, weight=1.5,
            tooltip=(
                f"<b>{row['district']}</b><br>"
                f"DPI: {row['dpi']:.1f} ({row.get('dpi_label','')})<br>"
                f"Poverty Line: Rs.{int(row['poverty_line_mar2026']):,} (Mar 2026)<br>"
                f"Headcount: {row['headcount_2019']:.1f}% (2019)<br>"
                f"Cluster: {row.get('cluster','?')}<br>"
                f"Bonus: +{row['urgency_bonus']:.1f} pts"
            )
        ).add_to(m)
    m.save(output)
    print(f"  Circle map saved → {output}")
    return output

def save_json(df: pd.DataFrame,
              output="outputs/district_poverty_index.json"):
    os.makedirs(os.path.dirname(output), exist_ok=True)

    COORDS = {
        "Colombo":(6.9271,79.8612),"Gampaha":(7.0840,80.0098),
        "Kalutara":(6.5854,79.9607),"Kandy":(7.2906,80.6337),
        "Matale":(7.4675,80.6234),"Nuwara Eliya":(6.9497,80.7891),
        "Galle":(6.0535,80.2210),"Matara":(5.9549,80.5550),
        "Hambantota":(6.1429,81.1212),"Jaffna":(9.6615,80.0255),
        "Kilinochchi":(9.3803,80.3770),"Mannar":(8.9810,79.9044),
        "Vavuniya":(8.7514,80.4971),"Mullaitivu":(9.2671,80.8128),
        "Batticaloa":(7.7102,81.6924),"Ampara":(7.2985,81.6747),
        "Trincomalee":(8.5874,81.2152),"Kurunegala":(7.4863,80.3647),
        "Puttalam":(8.0362,79.8283),"Anuradhapura":(8.3114,80.4037),
        "Polonnaruwa":(7.9403,81.0188),"Badulla":(6.9934,81.0550),
        "Monaragala":(6.8728,81.3507),"Ratnapura":(6.6828,80.3992),
        "Kegalle":(7.2513,80.3464),
    }

    districts = {}
    for _, row in df.iterrows():
        d     = row["district"]
        coord = COORDS.get(d, (7.87, 80.77))
        districts[d] = {
            "dpi"                 : float(row["dpi"]),
            "dpi_label"           : str(row["dpi_label"]),
            "urgency_bonus"       : float(row["urgency_bonus"]),
            "cluster"             : str(row.get("cluster", "Unknown")),
            "lat"                 : coord[0],
            "lng"                 : coord[1],
            "poverty_line_mar2026": int(row["poverty_line_mar2026"]),
            "headcount_2019"      : float(row["headcount_2019"]),
            "col_ratio"           : float(row["col_ratio"]),
            "no_electricity"      : float(row["no_electricity"]),
            "no_safe_water"       : float(row["no_safe_water"]),
            "no_sanitation"       : float(row["no_sanitation"]),
            "unemployment"        : float(row["unemployment"]),
        }

    result = {
        "metadata": {
            "generated"               : datetime.now().isoformat(),
            "national_poverty_line"   : NATIONAL_POVERTY_LINE_MAR2026,
            "poverty_line_source"     : "DCS Sri Lanka — March 2026",
            "poverty_line_url"        : "https://www.statistics.gov.lk/povertyLine/2021_Rebase",
            "headcount_source"        : "DCS HIES 2019 (most recent available)",
            "infrastructure_source"   : "World Bank Open Data API (national, auto-fetched)",
            "ml_method"               : "K-Means clustering (n=3, scikit-learn)",
        },
        "districts": districts,
    }

    with open(output, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\n Saved {len(districts)} districts → {output}")
    return result

class DistrictPovertyIndex:
    def __init__(self,
                 path="outputs/district_poverty_index.json"):
        self.data   = {}
        self.gn_map = GN_TO_DISTRICT

        if os.path.exists(path):
            raw        = json.load(open(path, encoding="utf-8"))
            self.data  = raw.get("districts", raw)
            self.meta  = raw.get("metadata", {})
            print(f" DistrictPovertyIndex loaded — "
                  f"{len(self.data)} districts, "
                  f"poverty line: Rs.{self.meta.get('national_poverty_line',0):,} "
                  f"({self.meta.get('poverty_line_source','')})")
        else:
            print(f"  {path} not found. Run: python district_analysis.py")

    def get_district(self, gn_division: str) -> str:
        return self.gn_map.get(gn_division, "Unknown")

    def get_bonus(self, gn_division: str) -> float:
        district = self.get_district(gn_division)
        return float(self.data.get(district, {}).get("urgency_bonus", 0.0))

    def get_dpi(self, district: str) -> float:
        return float(self.data.get(district, {}).get("dpi", 0.0))

    def get_label(self, district: str) -> str:
        return self.data.get(district, {}).get("dpi_label", "Unknown")

    def get_cluster(self, gn_division: str) -> str:
        district = self.get_district(gn_division)
        return self.data.get(district, {}).get("cluster", "Unknown")

    def get_all(self) -> dict:
        return self.data

def run():
    print("=" * 60)
    print("  HopeConnect — District Poverty Analysis Pipeline")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    national = fetch_world_bank()
    df = build_district_dataframe(national)
    df = compute_dpi(df)
    df = cluster_districts(df, n_clusters=3)
    save_json(df)
    generate_map(df)
    return df


if __name__ == "__main__":
    run()