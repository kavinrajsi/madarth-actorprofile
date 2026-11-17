'use client';

import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {MaterialIcon} from '@/components/icons/MaterialIcon';
import styles from './form.module.css';

type Props = {
  legend: string;
  description?: string;
  /** Used in accessible names, e.g. "Portfolio link 2", "Remove portfolio link 2". */
  itemLabel: string;
  addLabel: string;
  addMoreLabel: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** Field errors keyed like "portfolioLinks.0"; looked up as `${errorKey}.${index}`. */
  errors: Record<string, string>;
  errorKey: string;
  max: number;
  /** Keep at least this many rows (1 shows an empty box straight away). */
  minRows?: number;
  placeholder?: string;
};

/** A repeatable list of URL inputs with Material add / delete buttons. */
export function LinkList({
  legend,
  description,
  itemLabel,
  addLabel,
  addMoreLabel,
  values,
  onChange,
  errors,
  errorKey,
  max,
  minRows = 0,
  placeholder = 'https://',
}: Props) {
  const lower = itemLabel.toLowerCase();
  return (
    <fieldset className={styles.links}>
      <legend className={styles.legend}>
        {legend} <span className={styles.optional}>(optional)</span>
      </legend>
      {description && <p className={styles.sectionText}>{description}</p>}
      {values.map((link, i) => {
        const message = errors[`${errorKey}.${i}`];
        return (
          <div className={styles.linkRow} key={i}>
            <TextInput
              label={`${itemLabel} ${i + 1}`}
              isLabelHidden
              type="url"
              value={link}
              placeholder={placeholder}
              onChange={(v) => onChange(values.map((l, j) => (j === i ? v : l)))}
              status={message ? {type: 'error', message} : undefined}
              width="100%"
            />
            {values.length > minRows && (
              <Button
                label={`Remove ${lower} ${i + 1}`}
                tooltip="Remove link"
                icon={<MaterialIcon name="delete" />}
                isIconOnly
                variant="ghost"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
              />
            )}
          </div>
        );
      })}
      {values.length < max && (
        <div>
          <Button
            label={values.length ? addMoreLabel : addLabel}
            icon={<MaterialIcon name="add" />}
            variant="secondary"
            onClick={() => onChange([...values, ''])}
          />
        </div>
      )}
    </fieldset>
  );
}
