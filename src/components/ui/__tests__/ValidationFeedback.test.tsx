import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ValidationFeedback,
  ValidatedInput,
  FormValidationSummary,
  useFormValidation,
} from '../ValidationFeedback'
import { ValidationError } from '@/lib/error-handling'

const mockErrors: ValidationError[] = [
  { field: 'email', message: 'Email is required', code: 'REQUIRED' },
  { field: 'email', message: 'Email is too short', code: 'TOO_SHORT' },
  { field: 'name', message: 'Name is required', code: 'REQUIRED' },
]

describe('ValidationFeedback', () => {
  it('renders nothing when no errors', () => {
    const { container } = render(<ValidationFeedback errors={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all errors when no field specified', () => {
    render(<ValidationFeedback errors={mockErrors} />)
    
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Email is too short')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('renders only field-specific errors when field specified', () => {
    render(<ValidationFeedback errors={mockErrors} field="email" />)
    
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Email is too short')).toBeInTheDocument()
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ValidationFeedback errors={mockErrors} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('ValidatedInput', () => {
  it('renders input with label', () => {
    render(
      <ValidatedInput
        value=""
        onChange={() => {}}
        label="Test Label"
      />
    )
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('renders textarea when rows specified', () => {
    render(
      <ValidatedInput
        value=""
        onChange={() => {}}
        rows={3}
      />
    )
    
    expect(screen.getByRole('textbox')).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('shows required indicator', () => {
    render(
      <ValidatedInput
        value=""
        onChange={() => {}}
        label="Test Label"
        required
      />
    )
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows character count when maxLength specified', () => {
    render(
      <ValidatedInput
        value="test"
        onChange={() => {}}
        maxLength={100}
      />
    )
    
    expect(screen.getByText('4/100')).toBeInTheDocument()
  })

  it('applies error styling when errors present', () => {
    render(
      <ValidatedInput
        value=""
        onChange={() => {}}
        errors={[{ field: 'test', message: 'Error', code: 'ERROR' }]}
        field="test"
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-300')
  })

  it('calls onChange when value changes', () => {
    const onChange = jest.fn()
    
    render(
      <ValidatedInput
        value=""
        onChange={onChange}
      />
    )
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'new value' } })
    
    expect(onChange).toHaveBeenCalledWith('new value')
  })

  it('calls onBlur when input loses focus', () => {
    const onBlur = jest.fn()
    
    render(
      <ValidatedInput
        value=""
        onChange={() => {}}
        onBlur={onBlur}
      />
    )
    
    const input = screen.getByRole('textbox')
    fireEvent.blur(input)
    
    expect(onBlur).toHaveBeenCalled()
  })

  it('respects disabled state', () => {
    render(
      <ValidatedInput
        value=""
        onChange={() => {}}
        disabled
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })
})

describe('FormValidationSummary', () => {
  it('renders nothing when no errors', () => {
    const { container } = render(<FormValidationSummary errors={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders error summary with all errors', () => {
    render(<FormValidationSummary errors={mockErrors} />)
    
    expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Email is too short')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <FormValidationSummary errors={mockErrors} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

// Test component for useFormValidation hook
const TestFormComponent = () => {
  const validation = useFormValidation(
    { email: '', name: '' },
    (values) => {
      const errors: ValidationError[] = []
      if (!values.email) {
        errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' })
      }
      if (!values.name) {
        errors.push({ field: 'name', message: 'Name is required', code: 'REQUIRED' })
      }
      return errors
    }
  )

  return (
    <div>
      <input
        data-testid="email"
        value={validation.values.email}
        onChange={(e) => validation.setValue('email', e.target.value)}
        onBlur={() => validation.setTouched('email')}
      />
      <input
        data-testid="name"
        value={validation.values.name}
        onChange={(e) => validation.setValue('name', e.target.value)}
        onBlur={() => validation.setTouched('name')}
      />
      <button onClick={() => validation.validate()}>Validate</button>
      <button onClick={() => validation.reset()}>Reset</button>
      <div data-testid="valid">{validation.isValid ? 'valid' : 'invalid'}</div>
      <div data-testid="errors">{validation.errors.length}</div>
    </div>
  )
}

describe('useFormValidation', () => {
  it('initializes with default values', () => {
    render(<TestFormComponent />)
    
    expect(screen.getByTestId('email')).toHaveValue('')
    expect(screen.getByTestId('name')).toHaveValue('')
    expect(screen.getByTestId('valid')).toHaveTextContent('invalid')
  })

  it('updates values correctly', () => {
    render(<TestFormComponent />)
    
    const emailInput = screen.getByTestId('email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('validates on demand', () => {
    render(<TestFormComponent />)
    
    const validateButton = screen.getByText('Validate')
    fireEvent.click(validateButton)
    
    expect(screen.getByTestId('errors')).toHaveTextContent('2')
    expect(screen.getByTestId('valid')).toHaveTextContent('invalid')
  })

  it('becomes valid when all fields are filled', () => {
    render(<TestFormComponent />)
    
    const emailInput = screen.getByTestId('email')
    const nameInput = screen.getByTestId('name')
    const validateButton = screen.getByText('Validate')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(nameInput, { target: { value: 'Test Name' } })
    fireEvent.click(validateButton)
    
    expect(screen.getByTestId('errors')).toHaveTextContent('0')
    expect(screen.getByTestId('valid')).toHaveTextContent('valid')
  })

  it('resets form correctly', () => {
    render(<TestFormComponent />)
    
    const emailInput = screen.getByTestId('email')
    const resetButton = screen.getByText('Reset')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput).toHaveValue('test@example.com')
    
    fireEvent.click(resetButton)
    expect(emailInput).toHaveValue('')
    expect(screen.getByTestId('errors')).toHaveTextContent('0')
  })
})