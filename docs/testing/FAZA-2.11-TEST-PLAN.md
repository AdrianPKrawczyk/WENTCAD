# Plan Testów FAZA 2.11 - Eksport DXF i Metki

**Wersja dokumentu:** 1.0  
**Data:** 2026-03-19  
**Automatyczne funkcje:** FAZA 2.11.1 - 2.11.4  
**Status:** Gotowy do testów

---

## Podsumowanie implementacji

| Nr | Funkcjonalność | Status |
|----|---------------|--------|
| 2.11.1 | Konfigurowalna wysokość czcionki DXF (0.05-0.5m) | ✅ |
| 2.11.2 | Regulacja odstępów (lineSpacing, paddingX, paddingY) | ✅ |
| 2.11.3 | Naprawa białego tła przy otwieraniu modala + migracja persist | ✅ |
| 2.11.4 | Połączone pola FLOW + SYSTEM w metkach | ✅ |
| 2.11.4b | Poprawka: system.id zamiast system.name | ✅ |

---

## 1. TESTY: RYSOWANIE STREF RĘCZNYCH

### TC-1.1: Rysowanie poligonu na pustym canvasie
- **Kroki:**
  1. Otwórz projekt / utwórz nowy
  2. Ustaw narzędzie "Rysuj poligon"
  3. Narysuj zamknięty poligon (min 3 punkty)
- **Oczekiwany rezultat:** Poligon pojawia się na canvasie, można go edytować

### TC-1.2: Przypisanie strefy do poligonu
- **Kroki:**
  1. Narysuj poligon
  2. Z menu kontekstowego lub panelu wybierz "Utwórz strefę"
  3. Wpisz numer i nazwę pomieszczenia
- **Oczekiwany rezultat:** Strefa zostaje utworzona, metka pojawia się na canvasie

### TC-1.3: Weryfikacja metki na ręcznie narysowanej strefie
- **Kroki:**
  1. Utwórz strefę z narysowanego poligonu
  2. Otwórz Kreator Metek
  3. Włącz pola: Nr+Nazwa, Nawiew (System), Wywiew (System)
- **Oczekiwany rezultat:** Na metce widoczne: "N1: X m³/h" i "W1: Y m³/h"

### TC-1.4: Edycja wierzchołków poligonu
- **Kroki:**
  1. Utwórz strefę z poligonem
  2. Wybierz narzędzie edycji
  3. Przeciągnij wierzchołek
- **Oczekiwany rezultat:** Powierzchnia przelicza się automatycznie

### TC-1.5: Usunięcie poligonu (zachowanie danych strefy)
- **Kroki:**
  1. Utwórz strefę z poligonem
  2. Usuń poligon (nie strefę)
- **Oczekiwany rezultat:** Dane strefy pozostają, metka znika z canvasu, strefa gotowa do ponownego narysowania

---

## 2. TESTY: IMPORT STREF Z DXF

### TC-2.1: Import obrysów z DXF
- **Kroki:**
  1. Zaimportuj plik DXF z obrysami pomieszczeń
  2. W oknie "Import DXF" wybierz warstwy do importu
  3. Potwierdź import
- **Oczekiwany rezultat:** Importowane poligony pojawiają się jako "niezmapowane strefy" (szare)

### TC-2.2: Mapowanie stref z DXF do bilansu
- **Kroki:**
  1. Zaimportuj DXF z obrysami
  2. Wybierz narzędzie "Linkuj strefę"
  3. Kliknij na importowany poligon
  4. Z listy wybierz odpowiednie pomieszczenie z bilansu
- **Oczekiwany rezultat:** Poligon zmienia kolor na zielony (zmapowany), metka pojawia się

### TC-2.3: Weryfikacja metek na zmapowanych strefach
- **Kroki:**
  1. Zmapuj importowany poligon z pomieszczeniem
  2. Sprawdź metkę na canvasie
- **Oczekiwany rezultat:** Metka zawiera poprawne dane z bilansu

### TC-2.4: Automatyczne obliczanie powierzchni z DXF
- **Kroki:**
  1. Zaimportuj poligony z DXF
  2. Sprawdź automatycznie wyliczoną powierzchnię
- **Oczekiwany rezultat:** Powierzchnia zgadza się z rzeczywistą (weryfikacja dla prostego pomieszczenia)

### TC-2.5: Import DXF z wieloma warstwami
- **Kroki:**
  1. Zaimportuj DXF z wieloma warstwami (ściany, okna, obrysy)
  2. Odfiltruj tylko obrysy pomieszczeń
- **Oczekiwany rezultat:** Zaimportowane tylko wybrane warstwy

### TC-2.6: Ponowny import tego samego pliku DXF
- **Kroki:**
  1. Zaimportuj DXF, zmapuj część stref
  2. Ponownie zaimportuj ten sam plik
- **Oczekiwany rezultat:** Zmapowane strefy pozostają, nowe obrysy dodane jako niezmapowane

---

## 3. TESTY: ZACHOWANIE METEK - KOMBINACJE

### TC-3.1: Metka tylko z Nawiewem (bez Wywiewu)
- **Kroki:**
  1. Utwórz/edytuj pomieszczenie z przypisanym systemem nawiewnym, bez wywiewnego
  2. W Kreatorze Metek włącz tylko "Nawiew: System Wartość m³/h"
- **Oczekiwany rezultat:** Metka wyświetla tylko "N1: 300 m³/h"

### TC-3.2: Metka tylko z Wywiewem (bez Nawiewu)
- **Kroki:**
  1. Utwórz/edytuj pomieszczenie z przypisanym systemem wywiewnym, bez nawiewnego
  2. W Kreatorze Metek włącz tylko "Wywiew: System Wartość m³/h"
- **Oczekiwany rezultat:** Metka wyświetla tylko "W1: 60 m³/h"

### TC-3.3: Metka z oboma systemami
- **Kroki:**
  1. Utwórz/edytuj pomieszczenie z oboma systemami (Nawiew + Wywiew)
  2. W Kreatorze Metek włącz oba pola
- **Oczekiwany rezultat:** Metka wyświetla:
  ```
  N1: 300 m³/h
  W1: 60 m³/h
  ```

### TC-3.4: Pomieszczenie bez przypisanego systemu
- **Kroki:**
  1. Utwórz/edytuj pomieszczenie BEZ przypisanych systemów
  2. Sprawdź metkę
- **Oczekiwany rezultat:** Metka wyświetla "--: 0 m³/h" lub "--: -- m³/h"

### TC-3.5: Strefa z wieloma systemami nawiewnymi
- **Kroki:**
  1. Przypisz do pomieszczenia dwa systemy nawiewne (N1 i N2)
  2. Sprawdź metkę
- **Oczekiwany rezultat:** Zależy od logiki - albo "" albo pierwszy system, albo suma

### TC-3.6: Zmiana nazwy systemu a metka
- **Kroki:**
  1. Zmień nazwę systemu N1 na "Nawiew Główny"
  2. Sprawdź metkę
- **Oczekiwany rezultat:** Nadal wyświetla "N1: 300 m³/h" (ID się nie zmienia)

### TC-3.7: Metka z włączonymi wszystkimi polami
- **Kroki:**
  1. W Kreatorze Metek włącz WSZYSTKIE dostępne pola
  2. Utwórz strefę z wszystkimi danymi
- **Oczekiwany rezultat:** Metka czytelna, wszystkie dane widoczne lub zaznaczenie o dużej metce

### TC-3.8: Metka z polskimi znakami w nazwie pomieszczenia
- **Kroki:**
  1. Utwórz pomieszczenie: "Łazienka nr 1", system "Kanał Ściekowy"
  2. Wyeksportuj do DXF
- **Oczekiwany rezultat:** Polskie znaki poprawnie zakodowane w DXF (np. ³ jako Unicode)

### TC-3.9: Metka z bardzo długą nazwą
- **Kroki:**
  1. Utwórz pomieszczenie: "Toaleta dla osób niepełnosprawnych z dostępem dla wózków inwalidzkich"
  2. Sprawdź zachowanie metki na canvasie
- **Oczekiwany rezultat:** Metka może wyjść poza poligon, ale program nie pada

---

## 4. TESTY: KADRY DO EKSPORTU

### TC-4.1: Tworzenie kadru eksportu
- **Kroki:**
  1. Kliknij narzędzie "Kadrowanie" na pasku narzędzi
  2. Przeciągnij ramkę na obszar do eksportu
  3. Zapisz kadr z nazwą
- **Oczekiwany rezultat:** Kadr pojawia się na liście w oknie Eksportu

### TC-4.2: Eksport PNG z kadrem
- **Kroki:**
  1. Otwórz okno Eksportu
  2. Wybierz zapisany kadr
  3. Kliknij "Eksportuj do PNG"
- **Oczekiwany rezultat:** Plik PNG pobiera się poprawnie

### TC-4.3: Eksport DXF z kadrem
- **Kroki:**
  1. Otwórz okno Eksportu
  2. Wybierz zapisany kadr
  3. Zmień wysokość czcionki (np. 0.15 m)
  4. Kliknij "Eksportuj do DXF"
- **Oczekiwany rezultat:** Plik DXF pobiera się, metki mają nową wysokość

### TC-4.4: Weryfikacja DXF w AutoCAD/ZwCAD
- **Kroki:**
  1. Otwórz wyeksportowany plik DXF w AutoCAD/ZwCAD
  2. Sprawdź czytelność metek
- **Oczekiwany rezultat:** Metki czytelne, format poprawny "N1: 300 m³/h"

### TC-4.5: Wiele kadrów na jednej kondygnacji
- **Kroki:**
  1. Utwórz 3 kadry na jednej kondygnacji
  2. Przełączaj się między nimi w oknie Eksportu
- **Oczekiwany rezultat:** Lista kadrów widoczna, można wybrać dowolny

### TC-4.6: Kadry na różnych kondygnacjach
- **Kroki:**
  1. Utwórz kadr na Parterze
  2. Przełącz się na Piętro 1
  3. Utwórz kadr na Piętrze 1
- **Oczekiwany rezultat:** Kadry są przypisane do odpowiednich kondygnacji

### TC-4.7: Usunięcie kadru
- **Kroki:**
  1. Utwórz kadr
  2. W oknie Eksportu kliknij "Usuń kadr"
- **Oczekiwany rezultat:** Kadr znika z listy

### TC-4.8: Edycja nazwy kadru
- **Kroki:**
  1. Utwórz kadr "Kadr 1"
  2. Edytuj nazwę na "Salon"
- **Oczekiwany rezultat:** Nazwa aktualizuje się na liście

### TC-4.9: Eksport z włączonym/wyłączonym podkładem
- **Kroki:**
  1. Wyeksportuj PNG z podkładem
  2. Wyeksportuj PNG bez podkładu
- **Oczekiwany rezultat:** Dwa pliki - jeden z tłem, jeden bez (przezroczyste strefy)

---

## 5. TESTY: USTAWIEŃ CZCIONKI DXF

### TC-5.1: Minimalna wysokość czcionki
- **Kroki:**
  1. Ustaw wysokość czcionki na 0.05 m
  2. Wyeksportuj DXF
  3. Otwórz w AutoCAD
- **Oczekiwany rezultat:** Bardzo małe metki, czytelne przy powiększeniu

### TC-5.2: Maksymalna wysokość czcionki
- **Kroki:**
  1. Ustaw wysokość czcionki na 0.5 m
  2. Wyeksportuj DXF
- **Oczekiwany rezultat:** Bardzo duże metki, prawdopodobnie wykraczają poza poligony

### TC-5.3: Wartości pośrednie wysokości czcionki
- **Kroki:**
  1. Testuj: 0.08 m, 0.12 m, 0.2 m, 0.3 m
  2. Wyeksportuj i sprawdź czytelność
- **Oczekiwany rezultat:** Metki czytelne w optymalnym zakresie 0.08-0.2 m

### TC-5.4: Minimalny line spacing
- **Kroki:**
  1. Ustaw lineSpacing na 0.25
  2. Wyeksportuj DXF
- **Oczekiwany rezultat:** Wiersze bardzo blisko siebie, możliwe nakładanie

### TC-5.5: Maksymalny line spacing
- **Kroki:**
  1. Ustaw lineSpacing na 2.0
  2. Wyeksportuj DXF
- **Oczekiwany rezultat:** Duże odstępy między wierszami

### TC-5.6: Współpraca lineSpacing z wieloma wierszami
- **Kroki:**
  1. Włącz 4 pola w kolumnie 2 (Nawiew, Wywiew, ACH, Hałas)
  2. Ustaw różne lineSpacing
  3. Wyeksportuj
- **Oczekiwany rezultat:** Wszystkie wiersze mieszczą się w ramce

### TC-5.7: Minimalny/maxymalny paddingX
- **Kroki:**
  1. Testuj paddingX: 0.2 i 2.0
- **Oczekiwany rezultat:** Ramka odpowiednio ciasna/luźna wokół tekstu

### TC-5.8: Minimalny/maxymalny paddingY
- **Kroki:**
  1. Testuj paddingY: 0.1 i 1.0
- **Oczekiwany rezultat:** Ramka odpowiednio ciasna/luźna wokół tekstu

### TC-5.9: Kombinacja wszystkich parametrów na ekstremalnych wartościach
- **Kroki:**
  1. fontHeight=0.05, lineSpacing=2.0, paddingX=2.0, paddingY=1.0
  2. Wyeksportuj
- **Oczekiwany rezultat:** Duża ramka, mały tekst, duże odstępy

### TC-5.10: Suwak i pole numeryczne - synchronizacja
- **Kroki:**
  1. Zmień wartość suwakiem
  2. Sprawdź pole numeryczne
  3. Zmień wartość w polu numerycznym
  4. Sprawdź suwak
- **Oczekiwany rezultat:** Obie kontrolki pokazują tę samą wartość

---

## 6. TESTY: PERSYSTENCJA USTAWIEŃ

### TC-6.1: Zapis ustawień eksportu DXF
- **Kroki:**
  1. Otwórz okno Eksportu
  2. Zmień wysokość czcionki na 0.2 m
  3. Zmień line spacing na 1.5
  4. Zamknij modal
  5. Odśwież stronę (F5)
  6. Ponownie otwórz Eksport
- **Oczekiwany rezultat:** Wszystkie ustawienia są zapamiętane

### TC-6.2: Cold start - czyste localStorage
- **Kroki:**
  1. Wyczyść localStorage przeglądarki
  2. Załaduj aplikację
  3. Utwórz strefę, otwórz Eksport
- **Oczekiwany rezultat:** Domyślne wartości: fontHeight=0.1, lineSpacing=1.25, paddingX=1.0, paddingY=0.36

### TC-6.3: Migracja z FAZA 2.11.1 (tylko fontHeight)
- **Kroki:**
  1. Symuluj stary stan localStorage z FAZA 2.11.1 (tylko fontHeight)
  2. Załaduj aplikację
- **Oczekiwany rezultat:** Migracja v2→v3 dodaje brakujące pola z wartościami domyślnymi

### TC-6.4: Persystencja Kreatora Metek
- **Kroki:**
  1. Otwórz Kreator Metek
  2. Zmień konfigurację pól
  3. Zamknij modal
  4. Odśwież stronę
- **Oczekiwany rezultat:** Konfiguracja metek zachowana

### TC-6.5: Persystencja wielu kadrów
- **Kroki:**
  1. Utwórz 3 kadry
  2. Odśwież stronę
- **Oczekiwany rezultat:** Wszystkie kadry nadal istnieją

---

## 7. TESTY: INTEGRACJA RYSOWANIE + IMPORT

### TC-7.1: Ręczne + Import na tym samym canvasie
- **Kroki:**
  1. Zaimportuj obrysy z DXF (część zmapowana)
  2. Ręcznie dorysuj brakujące pomieszczenia
- **Oczekiwany rezultat:** Oba typy poligonów współistnieją

### TC-7.2: Zmiana metki po edycji poligonu
- **Kroki:**
  1. Zaimportuj DXF, zmapuj strefę
  2. Zmień kształt poligonu (edytuj wierzchołki)
  3. Sprawdź metkę - czy zmienił się strumień?
- **Oczekiwany rezultat:** Zależy od logiki powiązania - albo automatyczne przeliczenie, albo zachowanie

### TC-7.3: Konflikt - ta sama przestrzeń w DXF i ręcznie
- **Kroki:**
  1. Zaimportuj obrys z DXF
  2. Spróbuj narysować poligon w tym samym miejscu
- **Oczekiwany rezultat:** Oba poligony widoczne / ostrzeżenie o nakładaniu

### TC-7.4: Usunięcie strefy DXF a pozostałe
- **Kroki:**
  1. Zaimportuj 5 stref z DXF, zmapuj wszystkie
  2. Odmapuj jedną strefę
- **Oczekiwany rezultat:** Odmapowana strefa wraca do szarego koloru, pozostałe bez zmian

### TC-7.5: Wielokrotny import różnych plików DXF
- **Kroki:**
  1. Zaimportuj plik A
  2. Zaimportuj plik B
- **Oczekiwany rezultat:** Wszystkie obrysy widoczne

---

## 8. TESTY: EDGE CASES

### TC-8.1: Bardzo długa nazwa systemu
- **Kroki:**
  1. Zmień nazwę systemu na bardzo długą (np. "System Wentylacji Ogólnej Nawiewnej Numer 1")
  2. Sprawdź metkę
- **Oczekiwany rezultat:** Metka może się rozjechać, ale nie powoduje błędu

### TC-8.2: Strefa z wartością 0 m³/h
- **Kroki:**
  1. Utwórz pomieszczenie z calculatedVolume = 0
  2. Sprawdź metkę
- **Oczekiwany rezultat:** "N1: 0 m³/h" (nie "--" ani błąd)

### TC-8.3: Eksport przy braku stref
- **Kroki:**
  1. Nie twórz żadnych stref
  2. Utwórz kadr eksportu
  3. Eksportuj do DXF
- **Oczekiwany rezultat:** Pusty DXF (tylko ramka kadru) lub błąd "Brak stref do eksportu"

### TC-8.4: Strefa z ujemną wartością (nie powinno się zdarzyć)
- **Kroki:**
  1. Spróbuj wprowadzić ujemną wartość strumienia
- **Oczekiwany rezultat:** Walidacja blokuje ujemne wartości

### TC-8.5: Bardzo mała powierzchnia poligonu
- **Kroki:**
  1. Narysuj bardzo mały poligon (np. 0.01 m²)
  2. Sprawdź metkę
- **Oczekiwany rezultat:** Metka większa niż poligon, ale program działa

### TC-8.6: Bardzo duża powierzchnia
- **Kroki:**
  1. Narysuj poligon obejmujący cały budynek
  2. Wyeksportuj
- **Oczekiwany rezultat:** Program działa, DXF eksportuje się

### TC-8.7: Znak specjalny w nazwie systemu
- **Kroki:**
  1. Nazwij system: "N1/O1" lub "N1-1"
  2. Sprawdź metkę i DXF
- **Oczekiwany rezultat:** Znak specjalny poprawnie wyświetlony

### TC-8.8: Pusta nazwa pomieszczenia
- **Kroki:**
  1. Utwórz pomieszczenie bez nazwy (tylko numer)
  2. Sprawdź metkę
- **Oczekiwany rezultat:** Metka wyświetla tylko numer

### TC-8.9: Usunięcie systemu przypisanego do stref
- **Kroki:**
  1. Przypisz system N1 do 5 stref
  2. Usuń system N1
- **Oczekiwany rezultat:** Strefy tracą przypisanie, metki pokazują "--"

### TC-8.10: Zmiana ID systemu
- **Kroki:**
  1. Zmień ID systemu z "N1" na "NAW1"
  2. Sprawdź metki
- **Oczekiwany rezultat:** Wszystkie strefy aktualizują się do "NAW1"

---

## 9. TESTY: REGRESYJNE

### TC-9.1: Bilans powietrza - obliczenia
- **Kroki:**
  1. Utwórz pomieszczenie z wszystkimi parametrami (ludzie, krotność, urządzenia sanitarne)
  2. Sprawdź obliczony strumień nawiewny i wywiewny
- **Oczekiwany rezultat:** Obliczenia zgodne z normą

### TC-9.2: Kreator pomieszczeń - wszystkie presety
- **Kroki:**
  1. Przetestuj kreator dla różnych typów pomieszczeń (biuro, łazienka, kuchnia)
  2. Sprawdź domyślne wartości
- **Oczekiwany rezultat:** Poprawne domyślne wartości dla każdego typu

### TC-9.3: Eksport do Excel/CSV
- **Kroki:**
  1. Wyeksportuj dane bilansu do XLSX
  2. Sprawdź zawartość pliku
- **Oczekiwany rezultat:** Plik zawiera poprawne dane

### TC-9.4: Wiele kondygnacji - persystencja
- **Kroki:**
  1. Utwórz 3 kondygnacje z danymi
  2. Odśwież stronę
  3. Sprawdź czy wszystkie dane są zachowane
- **Oczekiwany rezultat:** Wszystkie kondygnacje i ich dane zachowane

---

## PODSUMOWANIE WYNKÓW TESTÓW

| Kategoria | TC | Status |
|-----------|-----|--------|
| Rysowanie stref | 5 | ⬜ |
| Import DXF | 6 | ⬜ |
| Kombinacje metek | 9 | ⬜ |
| Kadry eksportu | 9 | ⬜ |
| Ustawienia czcionki DXF | 10 | ⬜ |
| Persystencja | 5 | ⬜ |
| Integracja rysowanie + import | 5 | ⬜ |
| Edge cases | 10 | ⬜ |
| Regresyjne | 4 | ⬜ |
| **RAZEM** | **63** | |

### Legenda statusu:
- ⬜ Do testowania
- ✅ Zaliczony
- ❌ Niepowodzenie
- ⚠️ Wymaga dalszej analizy

---

## ZGŁOSZENIA BŁĘDÓW

| ID | Opis błędu | Kategoria | Priorytet | Status |
|----|-----------|-----------|-----------|--------|
| | | | | |

---

*Dokument wygenerowany: 2026-03-19*
