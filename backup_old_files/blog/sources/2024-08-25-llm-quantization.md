---
layout: post
title: "Exploring Llama.cpp with Llama Models"
description: Quantizing models for fun.
date: 2024-08-25
tags:
  - LLMs
  - Quantization
categories: language-models
---


While thinking about what to do this weekend, I decided to revisit and update the paper ``Fine-Tuning, Quantization, and LLMs: Navigating Unintended Outcomes`` with the latest models and additional insights on quantization. As I dug deeper into new references, I realized that the vulnerability aspect of model quantization hasn't been thoroughly explored. Previously, we used an off-the-shelf model to perform quick experiments, thanks to [The Bloke](https://huggingface.co/TheBloke) . Now, let’s dive into the latest findings and learn more about how to quantize models.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/llama_cpp.jpeg" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

## Open-Source Libraries for Model Quantization

During my research, I identified three standout open-source packages that are particularly effective for LLM quantization:
- **Llama.cpp**: A versatile tool that quickly became my go-to solution.
- **GPTQ**: Another robust option worth considering.
- **AWQ**: Completes the trio with its unique strengths.

I started with **Llama.cpp** and found it met all my requirements. So, I decided to move forward with this one. Let's dive into how to set up and use Llama.cpp.

### Setting Up Llama.cpp Locally

The first step in our journey is to set up Llama.cpp on your local machine. Start by cloning the repository and getting familiar with its structure:

```bash
git clone git@github.com:ggerganov/llama.cpp.git
cd ~/llama.cpp
```

Once the repository is cloned, you’ll need to install Llama.cpp locally. The following commands will ensure everything is set up correctly:

```bash
pip install -e .  # Installs Llama.cpp in editable mode
pip install -r requirements/requirements-convert_hf_to_gguf.txt
```

Now that the basic setup is complete, the next step is to build the necessary binaries for quantization. This is crucial for optimizing the models we’ll be working with:

```bash
make llama-quantize
```

In addition to this, we’ll also build the command-line interface (CLI) tool, which will allow us to validate models quickly and efficiently:

```bash
make llama-cli
```

With these tools in place, you’re now fully equipped to start experimenting with LLM quantization.


We'll start by targeting the following Llama models, known for their robustness against jailbreak attacks:

- **CodeLlama-7b**: A highly capable model for code-related tasks.
- **Llama-2-7b-chat-hf**: Excellent for conversational AI.
- **Llama-3-8b-instruct**: A model designed for instructional tasks.
- **Llama-3.1-8b-instruct**: An enhanced version of Llama-3, offering even greater capabilities.

### Downloading and Preparing Model Weights

To facilitate quick experimentation, I prefer to download model weights locally. This approach allows for faster processing and easier manipulation of the models. However, if you prefer, you can directly use the `--repo` flag in `llama-quantize` to work with models from the Hugging Face repository.

Here’s a Python script to download the models:

```bash
vim download_models.py
```

```python
from huggingface_hub import snapshot_download

model_ids = [
    "meta-llama/CodeLlama-7b-hf",
    "meta-llama/Llama-2-7b-chat-hf",
    "meta-llama/Meta-Llama-3-8B-Instruct",
    "meta-llama/Meta-Llama-3.1-8B-Instruct"
]

for model_id in model_ids:
    snapshot_download(
        repo_id=model_id,
        local_dir=model_id.split("/")[-1].lower().replace("-","_"),
        local_dir_use_symlinks=False,
    )
```

### Converting and Quantizing Models

After downloading the models, the next step is to convert them to the GGUF format, which is necessary for further quantization. We’ll start by converting the models to `fp16`, which stands for 16-bit floating point precision. To do this we can directly use the `conver_hf_to_gguf.py`. Though I've modified it to play around things that how much we can do with the python wrapper of it. If you're interested then you can find it over [here](https://github.com/divyanshugit/quantization/blob/main/convert_hf.py)

```python
python convert_hf.py meta_llama-3.1_8b_instruct --outfile llama_3.1_qf_16.gguf --outtype "f16"
```

Once the models are in GGUF format, we can proceed with quantizing them to 2-bit, 4-bit, and 8-bit representations. For instance, here’s how to convert the model to an 4-bit format:

```bash
./llama-quantize meta_llama_3.1_qf_16.gguf llama_3.1_8b_Q4_K_M.gguf Q4_K_M
```

### Validating the Quantized Model

With the quantized model in hand, it's essential to validate its performance. The `llama-cli` tool we built earlier will come in handy for this task. Here’s a command to test the model and assess its speed and accuracy:

```bash
./lama-cli -m llama_3.1_8b_Q4_K_M.gguf -p "You are a helpful assistant" -cnv
```

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/response.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

### Conclusion

Quantizing models is an effective strategy for optimizing them, particularly when dealing with limited resources. The tools and techniques we've explored provide a strong starting point for anyone interested in LLM quantization. For those curious to see the results in action, all the quantized models we discussed are available on Hugging Face in the Quantized-Llama Collection.

Additionally, if you want; you can use `llama-cpp-python` for model inference, as `ctransformers` is currently not updated to support the latest model architectures.

### References:
- [Llama.cpp](https://github.com/ggerganov/llama.cpp)
- [llama-cpp-python](https://github.com/abetlen/llama-cpp-python)
- [Fine-Tuning, Quantization, and LLMs: Navigating Unintended Outcomes](https://arxiv.org/abs/2404.04392)
