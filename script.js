// State Management
const state = {
  currentValue: '0',
  previousValue: null,
  operator: null,
  memory: 0,
  waitingForNewValue: false,
  lastInputType: null,
  error: null
};

// DOM References
let dom = {};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Store DOM references
  dom = {
    displayValue: document.getElementById('display-value'),
    memoryIndicator: document.getElementById('memory-indicator'),
    calculatorContainer: document.getElementById('calculator-container'),
    buttons: {
      numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => document.getElementById(`btn-${n}`)),
      decimal: document.getElementById('btn-decimal'),
      add: document.getElementById('btn-add'),
      subtract: document.getElementById('btn-subtract'),
      multiply: document.getElementById('btn-multiply'),
      divide: document.getElementById('btn-divide'),
      equals: document.getElementById('btn-equals'),
      clear: document.getElementById('btn-clear'),
      clearEntry: document.getElementById('btn-clear-entry'),
      delete: document.getElementById('btn-delete'),
      sqrt: document.getElementById('btn-sqrt'),
      percent: document.getElementById('btn-percent'),
      negate: document.getElementById('btn-negate'),
      reciprocal: document.getElementById('btn-reciprocal'),
      memoryAdd: document.getElementById('btn-memory-add'),
      memorySubtract: document.getElementById('btn-memory-subtract'),
      memoryRecall: document.getElementById('btn-memory-recall'),
      memoryClear: document.getElementById('btn-memory-clear')
    }
  };

  // Initialize display
  updateDisplay(state.currentValue);
  
  // Setup event listeners
  setupEventListeners();
});

// Core Functions
function updateDisplay(value) {
  if (!dom.displayValue) return;
  
  let displayText = value;
  const numValue = parseFloat(value);
  
  // Handle scientific notation for large numbers
  if (!isNaN(numValue) && Math.abs(numValue) >= 1e12) {
    displayText = numValue.toExponential(6);
  } else if (value.length > 12 && !value.includes('e')) {
    displayText = parseFloat(value).toExponential(6);
  }
  
  dom.displayValue.textContent = displayText;
}

function showError(message) {
  state.error = message;
  updateDisplay(message);
  if (dom.calculatorContainer) {
    dom.calculatorContainer.classList.add('error-state');
  }
}

function clearError() {
  state.error = null;
  if (dom.calculatorContainer) {
    dom.calculatorContainer.classList.remove('error-state');
  }
}

function handleNumber(digit) {
  if (state.error) return;
  
  // Start new number if waiting
  if (state.waitingForNewValue) {
    state.currentValue = digit === '.' ? '0.' : digit;
    state.waitingForNewValue = false;
  } else {
    // Handle decimal point
    if (digit === '.') {
      if (state.currentValue.includes('.')) return;
      state.currentValue += '.';
    } else {
      // Replace initial 0
      if (state.currentValue === '0') {
        state.currentValue = digit;
      } else {
        // Check max digits before decimal
        const beforeDecimal = state.currentValue.split('.')[0];
        if (beforeDecimal.length >= 12 && !state.currentValue.includes('.')) return;
        state.currentValue += digit;
      }
    }
  }
  
  state.lastInputType = 'number';
  updateDisplay(state.currentValue);
}

function handleOperator(op) {
  if (state.error) return;
  
  const currentNum = parseFloat(state.currentValue);
  
  // If previous operation exists and last input was number, calculate
  if (state.previousValue !== null && state.operator !== null && state.lastInputType === 'number') {
    const result = calculate(state.previousValue, state.operator, currentNum);
    
    if (result.error) {
      showError(result.error);
      return;
    }
    
    state.currentValue = result.toString();
    updateDisplay(state.currentValue);
  }
  
  // Store current value and operator
  state.previousValue = parseFloat(state.currentValue);
  state.operator = op;
  state.waitingForNewValue = true;
  state.lastInputType = 'operator';
}

function handleEquals() {
  if (state.error) return;
  
  if (state.previousValue !== null && state.operator !== null) {
    const currentNum = parseFloat(state.currentValue);
    const result = calculate(state.previousValue, state.operator, currentNum);
    
    if (result.error) {
      showError(result.error);
      return;
    }
    
    state.currentValue = result.toString();
    state.previousValue = null;
    state.operator = null;
    state.waitingForNewValue = true;
    state.lastInputType = 'equals';
    updateDisplay(state.currentValue);
  }
}

function calculate(a, operator, b) {
  let result;
  
  switch (operator) {
    case '+':
      result = a + b;
      break;
    case '-':
      result = a - b;
      break;
    case '*':
      result = a * b;
      break;
    case '/':
      if (b === 0) {
        return { error: 'ERROR: Division durch 0' };
      }
      result = a / b;
      break;
    default:
      return { error: 'ERROR: Ungültige Eingabe' };
  }
  
  // Check for overflow/underflow
  if (!isFinite(result) || Math.abs(result) > 1e308) {
    return { error: 'ERROR: OVERFLOW' };
  }
  
  // Round to 10 decimal places and remove trailing zeros
  result = parseFloat(result.toFixed(10));
  
  return result;
}

function handleFunction(func) {
  if (state.error) return;
  
  const currentNum = parseFloat(state.currentValue);
  let result;
  
  switch (func) {
    case 'sqrt':
      if (currentNum < 0) {
        showError('ERROR: Ungültige Eingabe');
        return;
      }
      result = Math.sqrt(currentNum);
      break;
      
    case 'percent':
      // Unary: simple percentage (x/100)
      if (state.previousValue === null || state.operator === null) {
        result = currentNum / 100;
      } else {
        // Binary: percentage of previous value (a + a*b/100)
        result = currentNum / 100;
      }
      break;
      
    case 'negate':
      result = currentNum * -1;
      break;
      
    case 'reciprocal':
      if (currentNum === 0) {
        showError('ERROR: Division durch 0');
        return;
      }
      result = 1 / currentNum;
      break;
      
    default:
      showError('ERROR: Ungültige Eingabe');
      return;
  }
  
  // Check for overflow
  if (!isFinite(result) || Math.abs(result) > 1e308) {
    showError('ERROR: OVERFLOW');
    return;
  }
  
  // Round to 10 decimal places
  result = parseFloat(result.toFixed(10));
  
  state.currentValue = result.toString();
  state.waitingForNewValue = true;
  state.lastInputType = 'function';
  updateDisplay(state.currentValue);
}

function handleClear(type) {
  clearError();
  
  switch (type) {
    case 'C':
      // Full reset except memory
      state.currentValue = '0';
      state.previousValue = null;
      state.operator = null;
      state.waitingForNewValue = false;
      state.lastInputType = null;
      state.error = null;
      break;
      
    case 'CE':
      // Clear entry - double tap for full clear
      if (state.currentValue === '0' && state.lastInputType === 'clear-entry') {
        handleClear('C');
      } else {
        state.currentValue = '0';
        state.lastInputType = 'clear-entry';
      }
      break;
      
    case 'DEL':
      // Backspace - delete last digit
      if (state.currentValue.length > 1) {
        state.currentValue = state.currentValue.slice(0, -1);
      } else {
        state.currentValue = '0';
      }
      break;
  }
  
  updateDisplay(state.currentValue);
}

function handleMemory(action) {
  if (state.error && action !== 'MC') return;
  
  const currentNum = parseFloat(state.currentValue);
  
  switch (action) {
    case 'M+':
      state.memory += currentNum;
      state.waitingForNewValue = true;
      break;
      
    case 'M-':
      state.memory -= currentNum;
      state.waitingForNewValue = true;
      break;
      
    case 'MR':
      state.currentValue = state.memory.toString();
      state.waitingForNewValue = true;
      updateDisplay(state.currentValue);
      break;
      
    case 'MC':
      state.memory = 0;
      break;
  }
  
  // Update memory indicator
  if (dom.memoryIndicator) {
    if (state.memory !== 0) {
      dom.memoryIndicator.classList.add('memory-active');
      dom.memoryIndicator.classList.remove('hidden');
    } else {
      dom.memoryIndicator.classList.remove('memory-active');
      dom.memoryIndicator.classList.add('hidden');
    }
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Number buttons
  dom.buttons.numbers.forEach((btn, index) => {
    if (btn) {
      btn.addEventListener('click', () => handleNumber(index.toString()));
    }
  });
  
  // Decimal button
  if (dom.buttons.decimal) {
    dom.buttons.decimal.addEventListener('click', () => handleNumber('.'));
  }
  
  // Operator buttons
  if (dom.buttons.add) {
    dom.buttons.add.addEventListener('click', () => handleOperator('+'));
  }
  if (dom.buttons.subtract) {
    dom.buttons.subtract.addEventListener('click', () => handleOperator('-'));
  }
  if (dom.buttons.multiply) {
    dom.buttons.multiply.addEventListener('click', () => handleOperator('*'));
  }
  if (dom.buttons.divide) {
    dom.buttons.divide.addEventListener('click', () => handleOperator('/'));
  }
  
  // Equals button
  if (dom.buttons.equals) {
    dom.buttons.equals.addEventListener('click', handleEquals);
  }
  
  // Clear buttons
  if (dom.buttons.clear) {
    dom.buttons.clear.addEventListener('click', () => handleClear('C'));
  }
  if (dom.buttons.clearEntry) {
    dom.buttons.clearEntry.addEventListener('click', () => handleClear('CE'));
  }
  if (dom.buttons.delete) {
    dom.buttons.delete.addEventListener('click', () => handleClear('DEL'));
  }
  
  // Function buttons
  if (dom.buttons.sqrt) {
    dom.buttons.sqrt.addEventListener('click', () => handleFunction('sqrt'));
  }
  if (dom.buttons.percent) {
    dom.buttons.percent.addEventListener('click', () => handleFunction('percent'));
  }
  if (dom.buttons.negate) {
    dom.buttons.negate.addEventListener('click', () => handleFunction('negate'));
  }
  if (dom.buttons.reciprocal) {
    dom.buttons.reciprocal.addEventListener('click', () => handleFunction('reciprocal'));
  }
  
  // Memory buttons
  if (dom.buttons.memoryAdd) {
    dom.buttons.memoryAdd.addEventListener('click', () => handleMemory('M+'));
  }
  if (dom.buttons.memorySubtract) {
    dom.buttons.memorySubtract.addEventListener('click', () => handleMemory('M-'));
  }
  if (dom.buttons.memoryRecall) {
    dom.buttons.memoryRecall.addEventListener('click', () => handleMemory('MR'));
  }
  if (dom.buttons.memoryClear) {
    dom.buttons.memoryClear.addEventListener('click', () => handleMemory('MC'));
  }
  
  // Keyboard support
  document.addEventListener('keydown', (e) => {
    // Numbers and decimal
    if (e.key >= '0' && e.key <= '9') {
      handleNumber(e.key);
    } else if (e.key === '.') {
      handleNumber('.');
    }
    // Operators
    else if (e.key === '+') {
      handleOperator('+');
    } else if (e.key === '-') {
      handleOperator('-');
    } else if (e.key === '*') {
      handleOperator('*');
    } else if (e.key === '/') {
      e.preventDefault();
      handleOperator('/');
    }
    // Equals
    else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleEquals();
    }
    // Clear
    else if (e.key === 'Escape') {
      handleClear('C');
    }
    // Backspace
    else if (e.key === 'Backspace') {
      e.preventDefault();
      handleClear('DEL');
    }
  });
}