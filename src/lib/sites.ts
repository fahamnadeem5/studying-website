export interface SiteMeta {
  key: string;
  label: string;
  home: string;
  blurb: string;
}

/** Display metadata for the sites resources link back to. */
export const SITES: Record<string, SiteMeta> = {
  papacambridge: {
    key: "papacambridge",
    label: "PapaCambridge",
    home: "https://pastpapers.papacambridge.com/",
    blurb: "CAIE past papers archive (direct CDN links)",
  },
  "notes-papacambridge": {
    key: "notes-papacambridge",
    label: "PapaCambridge Notes",
    home: "https://notes.papacambridge.com/",
    blurb: "Free revision notes hosted by PapaCambridge",
  },
  pmt: {
    key: "pmt",
    label: "Physics & Maths Tutor",
    home: "https://www.physicsandmathstutor.com/",
    blurb: "CAIE paper collections on Physics & Maths Tutor",
  },
  reddit: {
    key: "reddit",
    label: "Reddit",
    home: "https://www.reddit.com/r/alevel/",
    blurb: "Files shared by the r/alevel community",
  },
};

export function siteMeta(key: string): SiteMeta {
  return (
    SITES[key] ?? {
      key,
      label: key,
      home: "",
      blurb: "",
    }
  );
}
