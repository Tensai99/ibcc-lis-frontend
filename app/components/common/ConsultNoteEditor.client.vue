<!-- components/ConsultNoteEditor.client.vue -->
<template>
  <div class="w-full rounded-xl border border-outline-variant/30 bg-white focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
    <ckeditor
      v-model="modelValue"
      :editor="ClassicEditor"
      :config="editorConfig"
      @ready="onReady"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Link,
  List,
  ListProperties,   // per-level list markers (nested bullet/number styles)
  Indent,           // generic indent / outdent commands
  IndentBlock,      // indentation for plain paragraphs, not just list items
  BlockQuote,
  Alignment,
} from 'ckeditor5'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import 'ckeditor5/ckeditor5.css'
import 'ckeditor5/ckeditor5-content.css'

const props = defineProps<{
  placeholder?: string
  readOnly?: boolean
}>()

const modelValue = defineModel<string>({ default: '' })

// unique lock id so multiple calls/toggles don't clash
const READ_ONLY_LOCK = 'consult-note-editor-lock'

let editorInstance: ClassicEditor | null = null

const editorConfig = {
  licenseKey: 'GPL',
  plugins: [
    Essentials, Paragraph, Heading, Bold, Italic, Link,
    List, ListProperties, Indent, IndentBlock, BlockQuote, Alignment,
  ],
  toolbar: [
    'heading', '|',
    'bold', 'italic', '|',
    'bulletedList', 'numberedList', '|',
    'outdent', 'indent', '|',
    'alignment:left', 'alignment:center', '|',
    'blockQuote', 'link', '|',
    'undo', 'redo',
  ],
  list: {
    properties: {
      styles: true,      // lets a nested level be bullet-in-number or number-in-bullet
      startIndex: true,
      reversed: true,
    },
  },
  placeholder: props.placeholder,
}

const applyReadOnly = (value: boolean | undefined) => {
  if (!editorInstance) return
  if (value) {
    editorInstance.enableReadOnlyMode(READ_ONLY_LOCK)
  } else {
    editorInstance.disableReadOnlyMode(READ_ONLY_LOCK)
  }
}

// Tab / Shift+Tab → indent / outdent.
// The generic `indent` command nests list items when inside a list, and indents
// paragraphs otherwise, so one binding covers "tabulate words" + list nesting.
// Registered at low priority so the List plugin's own list handling wins first.
const onReady = (editor: ClassicEditor) => {
  editorInstance = editor

  applyReadOnly(props.readOnly)

  editor.keystrokes.set('Tab', (_data: unknown, cancel: () => void) => {
    const cmd = editor.commands.get('indent')
    if (cmd?.isEnabled) { editor.execute('indent'); cancel() }
  }, { priority: 'low' })
  editor.keystrokes.set('Shift+Tab', (_data: unknown, cancel: () => void) => {
    const cmd = editor.commands.get('outdent')
    if (cmd?.isEnabled) { editor.execute('outdent'); cancel() }
  }, { priority: 'low' })
}

// react to prop changes after initial mount too
watch(() => props.readOnly, (value) => applyReadOnly(value))
</script>


<style scoped>
:deep(.ck-editor__editable) {
  min-height: 25rem; 
  max-height: 25rem;      /* same idea as your old max-h-100 (100 * 0.25rem) */
  overflow-y: auto;
}
</style>