'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Check, ChevronLeft, ChevronRight, FileText, User, Home, CreditCard } from 'lucide-react'

interface ContractFormData {
  propertyName: string
  tenantName: string
  tenantEmail: string
  tenantPhone: string
  monthlyRent: number
  currency: string
  startDate: string
  endDate: string
  deposit: number
  lateFee: number
}

export function ConversationalContractForm() {
  const t = useTranslations('contract_form')
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const steps = [
    { id: 'property', title: t('step_property'), icon: Home },
    { id: 'tenant', title: t('step_tenant'), icon: User },
    { id: 'terms', title: t('step_terms'), icon: FileText },
    { id: 'payment', title: t('step_payment'), icon: CreditCard },
  ]
  const { register, handleSubmit, trigger, formState: { errors } } = useForm<ContractFormData>()
  const nextStep = async () => {
    const fieldsToValidate = step === 0 ? ['propertyName'] as const
      : step === 1 ? ['tenantName', 'tenantEmail', 'tenantPhone'] as const
      : step === 2 ? ['monthlyRent', 'startDate', 'endDate'] as const
      : ['deposit', 'lateFee'] as const

    const valid = await trigger(fieldsToValidate as any)
    if (valid) {
      if (step < steps.length - 1) {
        setStep(s => s + 1)
      }
    }
  }

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const onSubmit = () => {
    setCompleted(true)
  }

  if (completed) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10"
          >
            <Check className="h-8 w-8 text-success" />
          </motion.div>
          <h3 className="text-xl font-bold text-foreground">{t('success_title')}</h3>
          <p className="mt-2 text-muted-foreground">{t('success_desc')}</p>
          <Button className="mt-6">{t('view_contract')}</Button>
        </CardContent>
      </Card>
    )
  }

  const StepIcon = steps[step].icon

  return (
    <Card>
      <CardContent className="p-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  i < step ? 'bg-success text-white' :
                  i === step ? 'bg-primary text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-2 h-0.5 w-8 sm:w-12 transition-colors ${i < step ? 'bg-success' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <StepIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{steps[step].title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step === 0 && t('desc_property')}
                    {step === 1 && t('desc_tenant')}
                    {step === 2 && t('desc_terms')}
                    {step === 3 && t('desc_payment')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {step === 0 && (
                  <Input
                    label={t('label_property_name')}
                    placeholder={t('placeholder_property')}
                    error={errors.propertyName?.message}
                    {...register('propertyName', { required: t('error_name_required') })}
                  />
                )}

                {step === 1 && (
                  <>
                    <Input label={t('label_tenant_name')} placeholder={t('placeholder_tenant_name')} error={errors.tenantName?.message} {...register('tenantName', { required: t('error_required') })} />
                    <Input label={t('label_email')} type="email" placeholder={t('placeholder_email')} error={errors.tenantEmail?.message} {...register('tenantEmail', { required: t('error_required'), pattern: { value: /^\S+@\S+$/i, message: t('error_invalid_email') } })} />
                    <Input label={t('label_phone')} placeholder={t('placeholder_phone')} error={errors.tenantPhone?.message} {...register('tenantPhone', { required: t('error_required') })} />
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label={t('label_monthly_rent')} type="number" placeholder={t('placeholder_monthly_rent')} error={errors.monthlyRent?.message} {...register('monthlyRent', { required: t('error_required'), valueAsNumber: true, min: { value: 1, message: t('error_greater_than_zero') } })} />
                      <Input label={t('label_currency')} defaultValue="COP" {...register('currency')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label={t('label_start_date')} type="date" error={errors.startDate?.message} {...register('startDate', { required: t('error_required') })} />
                      <Input label={t('label_end_date')} type="date" error={errors.endDate?.message} {...register('endDate', { required: t('error_required') })} />
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <Input label={t('label_deposit')} type="number" placeholder={t('placeholder_deposit')} error={errors.deposit?.message} {...register('deposit', { valueAsNumber: true })} />
                    <Input label={t('label_late_fee')} type="number" placeholder={t('placeholder_late_fee')} error={errors.lateFee?.message} {...register('lateFee', { valueAsNumber: true })} />
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button type="button" variant="ghost" onClick={prevStep} disabled={step === 0} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> {t('back')}
            </Button>
            <div className="flex gap-2">
              {step < steps.length - 1 ? (
                <Button type="button" onClick={nextStep} className="gap-1">
                  {t('next')} <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="gap-1">
                  <Check className="h-4 w-4" /> {t('create_contract')}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
