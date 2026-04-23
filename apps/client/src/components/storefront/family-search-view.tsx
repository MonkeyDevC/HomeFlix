import type { FamilySearchResultDto } from "../../lib/family/storefront-contracts";
import { FamilySearchInput } from "./family-search-input";
import { FamilySearchResults } from "./family-search-results";

export function FamilySearchView({
  result,
  profileName
}: Readonly<{ result: FamilySearchResultDto; profileName: string }>) {
  return (
    <div className="sf-search-page">
      <header className="sf-search-head">
        <h1 className="sf-page-title">Buscar</h1>
        <p className="sf-muted">Contenido disponible para {profileName}</p>
      </header>
      <FamilySearchInput />
      <FamilySearchResults result={result} />
    </div>
  );
}

