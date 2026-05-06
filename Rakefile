# frozen_string_literal: true

task :generate do
  sh "bundle exec ruby script/generate_rouge_assets.rb"
end

task build: :generate do
  sh "bundle exec jekyll build"
end

task serve: :generate do
  sh "bundle exec jekyll serve --livereload"
end

