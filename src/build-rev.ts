/**
 * Short commit shown in the footer.
 * A normal checkout is filled by the Vite plugin (git or SOURCE_REV).
 * GitHub's zip has no .git; export-subst replaces $Format:%H$ with the commit.
 */
export const BUILD_REV = "$Format:%H$";
