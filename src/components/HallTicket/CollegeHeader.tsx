import AuthImage from "../common/AuthImage";

interface CollegeHeaderProps {
  /** Stored path of the college logo/banner (loaded through the authorised /Files endpoint). */
  logo: string;
  /** Shown as a text header when there is no logo (or it cannot be loaded). */
  collegeName?: string;
  /** Tallest the logo may be; the hall ticket uses the default, compact printouts pass less. */
  logoMaxHeight?: string;
  /** Font size of the text fallback. */
  nameFontSize?: string;
}

/** The college banner/name block at the top of the hall ticket (and of the printed time tables). */
export default function CollegeHeader({
  logo,
  collegeName,
  logoMaxHeight = "30mm",
  nameFontSize = "22px",
}: CollegeHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderBottom: "2px solid black",
        paddingBottom: "10px",
      }}
    >
      <AuthImage
        src={logo}
        alt="logo"
        style={{ maxWidth: "100%", maxHeight: logoMaxHeight, objectFit: "contain" }}
        fallback={
          collegeName ? (
            <div
              style={{
                fontSize: nameFontSize,
                fontWeight: "bold",
                textAlign: "center",
                textTransform: "uppercase",
                padding: "6px 0",
              }}
            >
              {collegeName}
            </div>
          ) : null
        }
      />
    </div>
  );
}
