# Raport: Naprawa wycieku danych pomiędzy projektami (Data Leak)

**Data:** 2026-03-19
**Status:** Rozwiązany ✅

## 🔍 Opis błędu
Podczas tworzenia nowego projektu w Dashboardzie, program nieprawidłowo wczytywał dane rzutu (podkład, narysowane poligony) z poprzednio otwartego projektu. Działo się tak, gdy oba projekty korzystały z domyślnego identyfikatora kondygnacji `floor-parter`.

## 🛠 Analiza techniczna
- **Przyczyna**: `useCanvasStore` (odpowiedzialny za rzut 2D) przechowuje dane w lokalnej bazie IndexDB, indeksując je identyfikatorem kondygnacji (`floorId`). Ponieważ każdy projekt zaczynał się od kondygnacji o tym samym ID (`floor-parter`), nowo utworzony projekt "widział" dane poprzednika zapisane pod tym kluczem w przeglądarce.
- **Problem Persistence**: Dodatkowym czynnikiem był brak powiązania `useCanvasStore` z identyfikatorem projektu, co powodowało przenikanie się stanów rzutów w ramach tej samej przeglądarki.

---

## ✅ Rozwiązanie

1.  **Zdynamiczowanie ID Kondygnacji**: Inicjalna kondygnacja w nowym projekcie nie ma już sztywnego ID `floor-parter`. Zamiast tego generowany jest unikalny identyfikator `floor-uuid`.
2.  **Modyfikacja `useProjectStore`**: Funkcja `createProject` generuje teraz unikalne ID dla pierwszej kondygnacji ("Parter").
3.  **Modyfikacja `useZoneStore`**: Domyślne stany i migracje zostały zaktualizowane, aby unikać polegania na stałym stringu `floor-parter`.
4.  **Poprawka w komponentach**: W `AirBalanceTable.tsx` oraz `RoomWizardModal.tsx` usunięto hardcodowane odniesienia, zastępując je dynamicznym pobieraniem pierwszej dostępnej kondygnacji.

## 🧪 Wyniki Testów
1.  **Tworzenie Projektu A**: Wgranie podkładu PDF i narysowanie strefy na kondygnacji "Parter". (Sukces)
2.  **Powrót do Dashboardu i utworzenie Projektu B**: Nowy projekt otwiera się z czystym rzutem. Brak podkładu i stref z Projektu A. (Sukces)
3.  **Przełączanie pomiędzy projektami**: Każdy projekt poprawnie wczytuje swoje własne rysunki dzięki unikalnym kluczom `floorId`. (Sukces)

---

## ⚠️ Uwaga dla Użytkownika
Istniejące projekty, które zostały utworzone z ID `floor-parter`, nadal mogą wykazywać efekt "współdzielenia" rzutu, dopóki nie zostaną w nich utworzone nowe kondygnacje lub stare nie zostaną zmigrowane. Wszystkie NOWE projekty od tej pory są całkowicie odizolowane.
