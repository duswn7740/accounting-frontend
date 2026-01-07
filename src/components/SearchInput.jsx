import { useState } from 'react';
import styles from './SearchInput.module.css';

function SearchInput({
  items,
  codeValue,
  nameValue,
  onChange,
  onOpenModal,
  codeField = 'code',
  nameField = 'name',
  idField = 'id',
  outputCodeField,
  outputNameField,
  outputIdField,
  codePlaceholder = 'F2',
  namePlaceholder = 'F2'
}) {
  // 출력 필드명 (지정되지 않으면 입력 필드명과 동일)
  const outCodeField = outputCodeField || codeField;
  const outNameField = outputNameField || nameField;
  const outIdField = outputIdField || idField;
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [suggestionType, setSuggestionType] = useState('code'); // 'code' or 'name'

  // 코드 입력 변경
  const handleCodeChange = (value) => {
    onChange({ [outCodeField]: value, [outNameField]: '', [outIdField]: null });
    setSuggestionType('code');

    if (value) {
      const filtered = items.filter(item => item[codeField].includes(value));

      // 정확히 일치하는 항목이 있으면 자동 선택
      const exactMatch = items.find(item => item[codeField] === value);
      if (exactMatch) {
        onChange({
          [outIdField]: exactMatch[idField],
          [outCodeField]: exactMatch[codeField],
          [outNameField]: exactMatch[nameField]
        });
        setShowSuggestions(false);
        setSuggestions([]);
      } else {
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedSuggestionIndex(-1);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 이름 입력 변경
  const handleNameChange = (value) => {
    onChange({ [outNameField]: value, [outCodeField]: '', [outIdField]: null });
    setSuggestionType('name');

    if (value) {
      const filtered = items.filter(item => item[nameField].includes(value));

      // 정확히 일치하는 항목이 있으면 자동 선택
      const exactMatch = items.find(item => item[nameField] === value);
      if (exactMatch) {
        onChange({
          [outIdField]: exactMatch[idField],
          [outCodeField]: exactMatch[codeField],
          [outNameField]: exactMatch[nameField]
        });
        setShowSuggestions(false);
        setSuggestions([]);
      } else {
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedSuggestionIndex(-1);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 자동완성 항목 선택
  const handleSelectSuggestion = (item) => {
    onChange({
      [outIdField]: item[idField],
      [outCodeField]: item[codeField],
      [outNameField]: item[nameField]
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // 코드 키보드 이벤트
  const handleCodeKeyDown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      onOpenModal?.();
      return;
    }

    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = selectedSuggestionIndex < suggestions.length - 1
        ? selectedSuggestionIndex + 1
        : selectedSuggestionIndex;
      setSelectedSuggestionIndex(newIndex);

      if (newIndex >= 0 && suggestions[newIndex]) {
        onChange({
          [outIdField]: suggestions[newIndex][idField],
          [outCodeField]: suggestions[newIndex][codeField],
          [outNameField]: suggestions[newIndex][nameField]
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = selectedSuggestionIndex > 0 ? selectedSuggestionIndex - 1 : 0;
      setSelectedSuggestionIndex(newIndex);

      if (newIndex >= 0 && suggestions[newIndex]) {
        onChange({
          [outIdField]: suggestions[newIndex][idField],
          [outCodeField]: suggestions[newIndex][codeField],
          [outNameField]: suggestions[newIndex][nameField]
        });
      }
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // 이름 키보드 이벤트
  const handleNameKeyDown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      onOpenModal?.();
      return;
    }

    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = selectedSuggestionIndex < suggestions.length - 1
        ? selectedSuggestionIndex + 1
        : selectedSuggestionIndex;
      setSelectedSuggestionIndex(newIndex);

      if (newIndex >= 0 && suggestions[newIndex]) {
        onChange({
          [outIdField]: suggestions[newIndex][idField],
          [outCodeField]: suggestions[newIndex][codeField],
          [outNameField]: suggestions[newIndex][nameField]
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = selectedSuggestionIndex > 0 ? selectedSuggestionIndex - 1 : 0;
      setSelectedSuggestionIndex(newIndex);

      if (newIndex >= 0 && suggestions[newIndex]) {
        onChange({
          [outIdField]: suggestions[newIndex][idField],
          [outCodeField]: suggestions[newIndex][codeField],
          [outNameField]: suggestions[newIndex][nameField]
        });
      }
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <>
      <td style={{ position: 'relative' }}>
        <input
          type="text"
          value={codeValue}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={handleCodeKeyDown}
          className={styles.input}
          placeholder={codePlaceholder}
        />
        {showSuggestions && suggestionType === 'code' && (
          <div className={styles.autocompleteDropdown}>
            {suggestions.map((item, index) => (
              <div
                key={item[idField]}
                className={`${styles.autocompleteItem} ${index === selectedSuggestionIndex ? styles.selected : ''}`}
                onClick={() => handleSelectSuggestion(item)}
                onMouseEnter={() => setSelectedSuggestionIndex(index)}
              >
                {item[codeField]}
              </div>
            ))}
          </div>
        )}
      </td>

      <td style={{ position: 'relative' }}>
        <input
          type="text"
          value={nameValue}
          onChange={(e) => handleNameChange(e.target.value)}
          onKeyDown={handleNameKeyDown}
          className={styles.input}
          placeholder={namePlaceholder}
        />
        {showSuggestions && suggestionType === 'name' && (
          <div className={styles.autocompleteDropdown}>
            {suggestions.map((item, index) => (
              <div
                key={item[idField]}
                className={`${styles.autocompleteItem} ${index === selectedSuggestionIndex ? styles.selected : ''}`}
                onClick={() => handleSelectSuggestion(item)}
                onMouseEnter={() => setSelectedSuggestionIndex(index)}
              >
                {item[nameField]}
              </div>
            ))}
          </div>
        )}
      </td>
    </>
  );
}

export default SearchInput;
