# DYREKTYWA SYSTEMOWA: INTEGRACJA NORM (06) I MECHANIZM NADPISYWANIA KROTNOŚCI

UWAGA: Plik `docs/06-krotnosci_wymian.md` został dodany i jest od teraz JEDYNYM źródłem prawdy dla domyślnych wartości krotności.

Twoim zadaniem jest wdrożenie poniższych zmian w logice i UI:

## 1. ROZBUDOWA MODELU DANYCH (src/types.ts)
W interfejsie `ZoneData` dodaj pola:
- `isTargetACHManual: boolean;` // Flaga określająca, czy użytkownik ręcznie podał krotność.
- `manualTargetACH: number | null;` // Wartość wpisana ręcznie przez inżyniera.

## 2. LOGIKA SILNIKA (PhysicsEngine.ts)
Zaktualizuj funkcje obliczeniowe:
- Przy wyliczaniu `V_krotnosc`, program musi najpierw sprawdzić `isTargetACHManual`.
- Jeśli `true` -> użyj `manualTargetACH`.
- Jeśli `false` -> użyj wartości domyślnej z `docs/06-krotnosci_wymian.md` przypisanej do danego typu pomieszczenia.

## 3. AKTUALIZACJA UI (Tabela i Inspektor)
- W panelu 'Zone Details' (Inspektor) oraz w głównej tabeli dodaj obok pola krotności checkbox/toggle "Manual".
- Gdy "Manual" jest wyłączony, pole krotności powinno być zablokowane (read-only) i wyświetlać wartość z normy.
- Gdy "Manual" jest włączony, użytkownik może wpisać dowolną wartość, która staje się podstawą do obliczeń `V_final`.

## 4. INTEGRACJA KREATORA (Room Wizard)
- Room Wizard przy tworzeniu strefy domyślnie ustawia `isTargetACHManual: false` i pobiera wartość z pliku `06-krotnosci_wymian.md`.
- Jeśli użytkownik w kreatorze zmieni krotność na inną niż domyślna, flaga `isTargetACHManual` musi automatycznie przestawić się na `true`.

## 5. NAPRAWA INSPEKTORA (PRZYPOMNIENIE)
- Upewnij się, że WSZYSTKIE sekcje (Termodynamika z RH%, Akustyka, Systemy, Transfery) są już widoczne i edytowalne w Inspektorze, tak jak proszono w poprzedniej rewizji.

Zaktualizuj MEMORY.md po wdrożeniu tej logiki. Nie przechodź do Kroku 2 bez poprawnego działania mechanizmu nadpisywania krotności.